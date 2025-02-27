import { mailchimpClient } from "../../utils/mailchimp";
import crypto from 'crypto';
import { HttpError } from '../../utils/sessionHelpers';
import Stripe from "stripe";
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
         
        // Use a unified key for this endpoint (e.g., for "Find Me" or emailing)
        const rateLimitKey = `findMeLimit:${email}`;
        // Increment the counter.
        const attempts = await redis.incr(rateLimitKey);
        // On the first attempt, set a TTL for 30 seconds (30 seconds)
        if (attempts === 1) {
            await redis.expire(rateLimitKey, 30);
        }
        // If attempts > 2, user has exceeded the limit.
        if (attempts > 2) {
// Ensure that the key is locked out for 24 hours.
            await redis.expire(rateLimitKey, 86400);
            throw new HttpError("You have reached your limit for checking your subscription status today. Please try again in 24 hours.", 429);
        }
        // Check if we already flagged this email as not found
        const notFoundKey = `notFound:${email}`;
        const notFoundFlag = await redis.get(notFoundKey);
        if (notFoundFlag) {
            throw new HttpError("We couldn't find that email. So please subscribe first!", 404);
        }
        const paymentLink = await stripe.paymentLinks.create({
            line_items: [{
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1
            }],
            after_completion: {
                type: 'redirect',
                redirect: {url: 'http://localhost:3000/landing/thankyou'}
            }
        });
        const userEmail= email;
        await sendPaymentLinkEmailViaMailchimp(userEmail, paymentLink.url);
    
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
        }
// For any other error, throw a 500 error.
        throw new HttpError("Error retrieving subscriber data from Mailchimp", 500);
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