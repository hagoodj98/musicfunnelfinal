import crypto from 'crypto';
import { mailchimpClient } from '@/app/utils/mailchimp';
import Bottleneck from 'bottleneck';
import redis from '@/app/utils/redis';

// Bottleneck limiter configuration
const limiter = new Bottleneck({
  maxConcurrent: 1, // Number of simultaneous requests
  minTime: 200,      // Minimum time between requests (in ms)
});
const listID = process.env.MAILCHIMP_LIST_ID; 

//adding the subscriber
export async function POST(request) {
  const { email, name } = await request.json();

  console.log('recieved data:', { email, name });

  try {
    const addSubscriber = limiter.wrap(async (email, name) => {
      console.log('Adding subscriber to Mailchimp:', email);
      return await mailchimpClient.lists.addListMember(listID, {
        email_address: email,
        status: "pending",
        merge_fields: {
          FNAME: name
          }
        })
    });

    // Call the rate-limited function
    await addSubscriber(email, name);

  // Store "pending" in Redis
    const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
    await redis.set(emailHash, 'pending', 'EX', 3600); // Expire in 1 hour
    return new Response(JSON.stringify({ status: 'pending' }), { status: 200 });
    } catch (error) {
      console.error('Error adding to Mailchimp:', error);
      if (error.response) {
        console.error('Mailchimp error response:', error.response.body);
      }
      return new Response(JSON.stringify({ error: 'Subscription failed' }), {status: 500});
    }
}

