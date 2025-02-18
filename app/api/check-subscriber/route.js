import { mailchimpClient } from "../../utils/mailchimp";
import crypto from 'crypto';
import { HttpError, checkRateLimit } from '../../utils/sessionHelpers';
import { rateLimiter } from "../../utils/ratelimiter";

const listID = process.env.MAILCHIMP_LIST_ID;

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || 'unknown';
        // Consume one point for this IP
        try {
            await rateLimiter.consume(ip);
        } catch (rlRejected) {
            // If rate limit is exceeded, rlRejected contains the remaining time
            throw new HttpError("Too Many Requests, please try again later.", 429);
        }
        const { email } =  await req.json();
        if (!email) {
           throw new HttpError('Email is required', 400);
        }
    // Rate limiting: allow "Find me" call only once per email.
        const rateLimitKey = `findMeLimit:${email}`;
        const allowed = await checkRateLimit(rateLimitKey, 1, 3600);
        if (!allowed) {
        throw new HttpError("You reached your limit. Please try again later.", 429);
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
            throw new HttpError("Mhm we couldn't find that email. You should subscribe!🙃", 404);
        }
// For any other error, throw a 500 error.
        throw new HttpError("Error retrieving subscriber data from Mailchimp", 500);
    }
    // If we get here, the member was found.
        return new Response(JSON.stringify({ message: 'Ahh! We found that you are a subscriber. No need to proceed any further. Instead, please check email! 🙂✅' }),{ status: 200 });
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