
import crypto from 'crypto';
import redis from '../../utils/redis';
import { error } from 'console';

export async function POST(req) {
  try {
    const body = await req.text(); //parse text body
    const params = new URLSearchParams(body);
    const type = params.get('type');
    const email = params.get('data[email]');
  
    console.log('Webhook Recieved:', { type, email });

    if ( type !== 'subscribe' || !email) {
      console.error('Webhook Error: Invalid or missing data');
      return new Response(JSON.stringify({error: 'Invalid or missing data'}), { status: 400 });
    } 
    //This is to get access to the second redis database set up. Which contains the hash and salt that this email is associated with.
    const mappingString = await redis.get(`emailToHashMapping${email}`);
    //This checks if this email even exist. If not, then that means the user has not done anything.
    if (!mappingString) {
      console.error('Webhook Error: No mapping found for email:', email);
      return new Response(JSON.stringify({error: 'No session information found for this email'}), { status: 404 });
    }
    const {emailHash, salt } = JSON.parse(mappingString);
    // Check if the verified hash matches the original email hash
    const verifiedHash = crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');
    if (verifiedHash !== emailHash) {
      console.error('Webhook Error: Hash mismatch for email:', email);
      return new Response(JSON.stringify({error: 'Unauthorized access'}), { status: 400 });
    }
    // Retrieve the preliminary session data using the hash
    const sessionDataString = await redis.get(`prelimSession:${emailHash}`);
    //Same thing here. If no email exist, then the user did not do anything.
    if (!sessionDataString) {
      console.error('Webhook Error: No session data found for hash:', emailHash);
      return new Response(JSON.stringify({ error: 'Session data not found' }), { status: 404 });
    }
    //Parse the session data to get the stored salt and update the status to subscribed
    const sessionData = JSON.parse(sessionDataString); 
    sessionData.status = 'subscribed';
    // Store the updated session data back in Redis
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
  