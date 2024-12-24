import crypto from 'crypto';
import redis from '@/app/utils/redis';

export async function POST(req) {

  const body = await req.text(); //parse text body
  const params = new URLSearchParams(body);
    
  if(params.get('type') === 'subscribe') {
    const email = params.get('data[email]');
    const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  
    // Update Redis to "subscribed"
    await redis.set(emailHash, 'subscribed', 'EX', 3600); // Expire in 1 hour
    console.log(`User confirmed subscription: ${email}`);
  }
  return new Response('Webhook processed', { status: 200 });
}
/*
export async function GET() {
  return new Response('GET method not supported for this route', { status: 405 });
}
  */

export function GET() {
  return new Response('Webhook endpoint is live', { status: 200 });
}
  