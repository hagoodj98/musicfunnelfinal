import { mailchimpClient } from "../../utils/mailchimp";
import crypto from 'crypto';
import { HttpError } from '../../utils/sessionHelpers';
import Stripe from "stripe";
import { validateEmail } from '../../utils/validateEmail';
import { sendPaymentLinkEmailViaMailchimp } from "../../utils/mailchimpHelpers";
import redis from "../../utils/redis";
const listID = process.env.MAILCHIMP_LIST_ID;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export async function POST(req) {
    try {
        const { email } =  await req.json();
        if (!email) {
           throw new HttpError('Email is required', 400);
        }
        if (!validateEmail(email)) {
            throw new HttpError('Invalid email format for email', 400);
        } 

        // Use a unified key for this endpoint (e.g., for "Find Me" or emailing)
        const rateLimitKey = `findMeLimit:${email}`;
        // Increment the counter.
        const attempts = await redis.incr(rateLimitKey);
        // On the first attempt, set a TTL for 30 seconds (30 seconds)
      
        if (attempts === 1) {
            await redis.expire(rateLimitKey, 30);
          }
      
          // For attempts 2 and 3, send a payment link via email.
          if (attempts === 2) {
            // Extend the TTL to 24 hours so the rate limit remains effective.
            await redis.expire(rateLimitKey, 86400);
      
            // Create a Stripe payment link.
            const paymentLink = await stripe.paymentLinks.create({
              line_items: [{
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1
              }],
              after_completion: {
                type: 'redirect',
                redirect: { url: 'http://localhost:3000/landing/thankyou' }
              }
            });
      
            // Send the payment link via email.
            await sendPaymentLinkEmailViaMailchimp(email, paymentLink.url);
      
            // Throw an error to indicate too many checkout attempts.
            throw new HttpError("Too many checkout attempts. Please check your email for the payment link.", 429);
          }
          // For attempts 4 or more, do not generate another link.
          if (attempts >= 3) {
            throw new HttpError("No more payment links can be generated in a 24 hour span. Please check your email again or send me an email for assistance.", 429);
          }
      
          // If this is the first attempt, proceed with the normal flow:
          // Check if we have previously flagged this email as not found.
          const notFoundKey = `notFound:${email}`;
          const notFoundFlag = await redis.get(notFoundKey);
          if (notFoundFlag) {
            throw new HttpError("We couldn't find that email. So please subscribe first!", 404);
          }
// Generate the subscriber hash required by Mailchimp (MD5 hash of the lowercase email)
        const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
        
// Call Mailchimp's API to get the list member data
// If the member is not found, mailchimpClient.lists.getListMember might throw an error.
    let member;
    try {
        member = await mailchimpClient.lists.getListMember(listID, subscriberHash);
    } catch (error) {
// If Mailchimp returns a 404 error (member not found), throw an HttpError with 404 status.
        if (error.status === 404) {
            await redis.set(notFoundKey, "true", "EX", 86400);
            throw new HttpError("Mhm we couldn't find that email. You should subscribe!🙃", 404);
        } else {
// For any other error, throw a 500 error.
            throw new HttpError("Error retrieving subscriber data from Mailchimp", 500);
        }
    }
    // If we get here, the member was found.
        return new Response(JSON.stringify({ message: 'Ahh! We found that you are a subscriber. If you wanted to make a purchase, I just sent you an email! 🙂✅' }),{ status: 200 });
    } catch (error) {
        console.error("Error in check-subscriber endpoint:", error);
        // If the error is an instance of HttpError, use its status and message. It means i don’t have to manually check for errors everywhere—the utility functions or my code throw HttpError when something goes wrong, and the catch block sends the right response.
        if (error instanceof HttpError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
// For any other errors, return a 500 error.
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }

}