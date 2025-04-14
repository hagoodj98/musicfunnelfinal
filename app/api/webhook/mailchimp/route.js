
import crypto from 'crypto';
import redis from '../../../utils/redis.js';
import { getEmailMapping, HttpError } from '../../../utils/sessionHelpers.js';

export async function POST(req) {
  try {
    const body = await req.text(); //parse text body that is coming in from mailchimp
    const params = new URLSearchParams(body);
  
    const type = params.get('type');
    const email = params.get('data[email]');
  
    if ( type !== 'subscribe' || !email) {
      console.error('Webhook Error: Invalid or missing data');
      throw new HttpError('Invalid or missing data', 400);
    } 
   
    const mapping = await getEmailMapping(email);

    const { emailHash, salt } = mapping;

    const verifiedHash = crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');
 
    if (verifiedHash !== emailHash) {
      throw new HttpError('Unauthorized access', 400);
    }
  
    const sessionDataString = await redis.get(`prelimSession:${emailHash}`);
 
    if (!sessionDataString) {
      throw new HttpError('Session data not found', 404);
    }
    const sessionData = JSON.parse(sessionDataString); 
    const ttl = sessionData.rememberMe ? 604800 : 900; 
    // Update the session data with the new status
    sessionData.status = 'subscribed';

    await redis.multi().set(`session:${emailHash}`, JSON.stringify(sessionData), 'EX', ttl).del(`prelimSession:${emailHash}`).exec();
    
    return new Response(JSON.stringify({ status: 'subscribed', details: sessionData }), { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    if (error instanceof HttpError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status
      });
    }
    return new Response(JSON.stringify({error: 'Internal Server Error'}), { status: 500 });
  }
}

export function GET() {
  return new Response('Webhook endpoint is live', { status: 200 });
}
  