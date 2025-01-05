import crypto from 'crypto';
import { mailchimpClient } from '../../utils/mailchimp';
import Bottleneck from 'bottleneck';
import redis from '../../utils/redis';
import { serialize as serializeCookie } from 'cookie'

// Bottleneck limiter configuration
const limiter = new Bottleneck({
  maxConcurrent: 1, // Number of simultaneous requests
  minTime: 200,      // Minimum time between requests (in ms)
});

const listID = process.env.MAILCHIMP_LIST_ID; 

//adding the subscriber
export async function POST(req, res) {
  const { email, name } = await req.json();

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
        });
    });

    // Call the rate-limited function
    await addSubscriber(email, name);

    //Generate a session token and hash email
    const sessionToken = crypto.randomBytes(24).toString('hex');
    const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  // Store session token and subscription status in Redis
    await redis.set(`session:${sessionToken}`, emailHash, 'EX', 3600)
    await redis.set(`status:${emailHash}`, 'pending', 'EX', 3600); // Expire in 1 hour

    //set session token in an HTTP-only cookie
    const cookie = serializeCookie('sessionToken', sessionToken, {
      httpOnly: true, //Cookie inaccesible tp JavaScript's Document.cookie API
      secure: process.env.NODE_ENV !== 'development', //Use secure cookies in production
      path: '/',
      maxAge: 3600, // 1 hour
      sameSite: 'strict'
    });

    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({status: 'pending' });
    // Add 'Set-Cookie' header to the response
  
    } catch (error) {
      console.error('Error adding to Mailchimp:', error);
      if (error.response) {
        console.error('Mailchimp error response:', error.response.body);
      }
      res.status(500).json({ error: 'Subscription failed' });
    }
}

