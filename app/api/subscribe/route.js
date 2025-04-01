import crypto from 'crypto';
import { mailchimpClient } from '../../utils/mailchimp.js';
import Bottleneck from 'bottleneck';
import redis from '../../utils/redis.js';
import { updateMailchimpTag } from '../../utils/mailchimpHelpers.js';
import { validateEmail } from '../../utils/validateEmail.js';
import { generateTokenAndSalt, HttpError } from '../../utils/sessionHelpers.js';
// Bottleneck limiter configuration
const limiter = new Bottleneck({
  maxConcurrent: 1, // Only one function runs at a time. Only one call to the wrapped function will execute at any given moment.
  minTime: 200, // Wait at least 200 milliseconds between each function call. After one call completes, Bottleneck will wait 200 milliseconds before starting the next call.
});

const listID = process.env.MAILCHIMP_LIST_ID; 

//adding the subscriber
export async function POST(req) {
 
  // Validate email is provided and in proper format
 
  try {
    const { email, name, rememberMe } = await req.json();

    if (!email) {
      throw new HttpError('Email is required', 400);
    }
  
    if (!validateEmail(email)) {
      throw new HttpError('Invalid email format for email', 400);
    }
  
    const addSubscriber = limiter.wrap(async (email, name) => {
      
      const response = await mailchimpClient.lists.addListMember(listID, {
        email_address: email,
        status: "pending",
        merge_fields: { FNAME: name },
      });
     
      return response;
    });

    // Call the rate-limited function
    await addSubscriber(email, name);

    const { salt } = generateTokenAndSalt(); 
// Create an email hash
    const emailHash = crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');

// Decide on TTL based on rememberMe (for preliminary session storage)
    const ttl = rememberMe ? 604800 : 100; // 1 week vs 15 minutes

    const preliminarysessionData = {email, name, status: 'pending', salt, rememberMe };

// Store the session data
   
    await redis.set(`prelimSession:${emailHash}`, JSON.stringify(preliminarysessionData), 'EX', ttl);

    await redis.set(`emailToHashMapping:${email}`, JSON.stringify({ emailHash, salt }), 'EX', ttl);

    return new Response(JSON.stringify({message: "Subscription initiated. Please check your email to confirm. Don't see it, check spam!!", status: 'pending' }), { status: 200 });
  } catch (error) {
      console.error("Error during subscription process:", error);
      // If the error is already an instance of HttpError, use its status and message.
      if (error instanceof HttpError) {
        return new Response(JSON.stringify({ error: error.message }), { status: error.status });
      }
      // Otherwise, return a generic 500 Internal Server Error.
      return new Response(JSON.stringify({ error: 'Subscription failed due to an internal error' }), { status: 500 });
  }
}

