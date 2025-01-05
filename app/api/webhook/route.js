
import crypto from 'crypto';
import redis from '../../utils/redis';
import { error } from 'console';

export async function POST(req, res) {
  try {
    const body = await req.text(); //parse text body
    
    const params = new URLSearchParams(body);
    const type = params.get('type');
    const email = params.get('data[email]');

    console.log('Received body:', body);
    console.log('Parsed type:', type);
    console.log('Parsed email:', email);

    if (type !== 'subscribe' || !email) {
      console.error('Invalid or missing data');
      return res.status(400).json({error: 'Invalid or missing data'});
    }
    const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
     // Update Redis to "subscribed"
    await redis.set(`status:${emailHash}`, 'subscribed', 'EX', 3600); // Expire in 1 hour
    console.log(`User confirmed subscription: ${email}`);
    return res.status(200).send({error: 'Internal Server Error'});

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({error: 'Internal Server Error'});
  }
}

/*
export async function GET() {
  return new Response('GET method not supported for this route', { status: 405 });
}
  */

/*export function GET() {
  return new Response('Webhook endpoint is live', { status: 200 });
}
  */