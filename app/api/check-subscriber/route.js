import { mailchimpClient } from "../../utils/mailchimp";
import crypto from 'crypto';

const listID = process.env.MAILCHIMP_LIST_ID;


export async function POST(req) {
    try {
        const { email } =  await req.json();
        if (!email) {
            return new Response(JSON.stringify({error: 'Email is required' }), { status: 400 });
        }
    // Generate the subscriber hash required by Mailchimp (MD5 hash of the lowercase email)
        const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
        
        // Call Mailchimp's API to get the list member data
    // (mailchimpClient.lists.getListMember should return the member's info if found)
        const member = await mailchimpClient.lists.getListMember(listID, subscriberHash);

    // If we get here, the member was found.
        return new Response(JSON.stringify({ message: 'Ahh! We found that you are a subscriber. No need to proceed any further. Instead, please check email! 🙂✅' }),{ status: 200 });
    } catch (error) {
        console.error("Error in check-subscriber endpoint:", error);
           // If Mailchimp returns a 404 error (member not found), we respond accordingly.
    if (error.status === 404) { 
        return new Response(JSON.stringify({ message: "Email is not found. You should subscribe 🙃!" }),{ status: 404 });
    }
// For any other errors, return a 500 error.
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    
    }



}