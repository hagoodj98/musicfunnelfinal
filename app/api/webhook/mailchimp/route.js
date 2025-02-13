
/* This endpoint

  •	Verifies the incoming email by matching its hash using the stored salt.
	•	Retrieves the preliminary session data from Redis.
	•	Updates the user’s status to “subscribed” in the session data.
	•	Saves this updated session data back in Redis.
*/
import crypto from 'crypto';
import redis from '../../../utils/redis';

export async function POST(req) {
  try {
    const body = await req.text(); //parse text body that is coming in from mailchimp
    const params = new URLSearchParams(body);
    //I am interested in the parameters type and body cause that will give me the current status of user and what email its associated with
    const type = params.get('type');
    const email = params.get('data[email]');
  
    //For debugging. Lets me see what I have to work with
    console.log('Webhook Recieved:', { type, email });

    //If there is no email or status I'm looking for, then something went wrong. Its not the kind of data I am looking for. So I throw an error
    if ( type !== 'subscribe' || !email) {
      console.error('Webhook Error: Invalid or missing data');
      return new Response(JSON.stringify({error: 'Invalid or missing data'}), { status: 400 });
    } 
    //This is to get access to the second redis database setup in /subscribe. Which contains the hash and salt that this email is associated with. I want to be able to use the original salt to confirm if its the same exact email. I store all data associated to the mapping to mappingString
    const mappingString = await redis.get(`emailToHashMapping:${email}`);
    
    //This checks if this email even exists. If not, then that means the user has not submitted any data. If the user did, then a salt along with the emailHash would have been generated and stored in the emailToHashMapping key
    if (!mappingString) {
      console.error('Webhook Error: No mapping found for email:', email);
      return new Response(JSON.stringify({error: 'No session information found for this email'}), { status: 404 });
    }

    //Finally, at this point, there is session data associated with the emailToHashMapping I got from line 23. I extract the emailHash and salt from the emailToHashMapping. The reason being, I want to compare the email that came from mailchimp with its original salt. If there is a match, then this was the actual email. 
    const {emailHash, salt } = JSON.parse(mappingString);
    // Check if the verified hash matches the original email hash. If you look at this line of code, you can see its the same line in /subscribe line 46, which created the emailHash. And the email, coming from mailchimp, is stored in a variable (verifiedHash) here will tell me if this was the same email that created the emailHash in /subscribe
    const verifiedHash = crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');
    //This condition here, verifiedHash is the original salt and email from mailchimp, while the emailHash from emailToHashMapping key that I pulled on line 23 contains the original salt and email in /subscribe. If they don't match, then this email coming from mailchimp did not come from my application. Because any email sent to my server will be assigned an unique salt, so if they don't match, then my server did not process it. Thus, unauthorized access 
    if (verifiedHash !== emailHash) {
      console.error('Webhook Error: Hash mismatch for email:', email);
      return new Response(JSON.stringify({error: 'Unauthorized access'}), { status: 400 });
    }
    // Retrieve the preliminary session data using the hash. So at this point, the salt matches the email that came from mailchimp. So I want to get the prelimSession key that I set in line 52 /subscribe. The reason why is because it has all of the data I stored about the user thus far, such as email, name, salt, and status. In this case I am interested in the status. 
    const sessionDataString = await redis.get(`prelimSession:${emailHash}`);
    //Same thing here. If no prelimSession exist, then the user did not submit any data, cause again /subscribe caches two keys, one prelimSession: and the other emailToHashMapping:
    if (!sessionDataString) {
      console.error('Webhook Error: No session data found for hash:', emailHash);
      return new Response(JSON.stringify({ error: 'Session data not found' }), { status: 404 });
    }
    //Parse the session data to get the stored salt and update the status to subscribed
    const sessionData = JSON.parse(sessionDataString); 
    sessionData.status = 'subscribed';
    // Store the updated session data back in Redis with the new status. All that is left is for route check-status to check the status before issuing tokens
    await redis.set(`session:${emailHash}`, JSON.stringify(sessionData), 'EX', 3600);
    
    console.log(`Webhook Success: Subscription confirmed for email: ${email}`);
    return new Response(JSON.stringify({ status: 'subscribed', details: sessionData }), { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({error: 'Internal Server Error'}), { status: 500 });
  }
}

/*
export async function GET() {
  return new Response('GET method not supported for this route', { status: 405 });
}
  */

export function GET() {
  return new Response('Webhook endpoint is live', { status: 200 });
}
  