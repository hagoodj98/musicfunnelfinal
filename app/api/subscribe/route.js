import crypto from 'crypto';
import { mailchimpClient } from '../../utils/mailchimp';
import Bottleneck from 'bottleneck';
import redis from '../../utils/redis';
import { validateEmail } from '../../utils/validateEmail';


// Bottleneck limiter configuration
const limiter = new Bottleneck({
  maxConcurrent: 1, // Number of simultaneous requests
  minTime: 200,      // Minimum time between requests (in ms)
});

const listID = process.env.MAILCHIMP_LIST_ID; 

//adding the subscriber
export async function POST(req, res) {
  const { email, name } = await req.json();

  if (!validateEmail(email)) {
    console.error(`Invalid email format for email: ${email}`);
    return res.status(400).json({ error: 'Invalid email format' });
}

  console.log(`Received data: Email: ${email}, Name: ${name}`);
  try {
    const addSubscriber = limiter.wrap(async (email, name) => {
      console.log(`Attempting to add subscriber to Mailchimp: ${email}`);
      const response = await mailchimpClient.lists.addListMember(listID, {
        email_address: email,
        status: "pending",
        merge_fields: { FNAME: name }
      });
      console.log(`Subscriber added to Mailchimp audience with status: ${response.status}`);
      return response;
    });

    // Call the rate-limited function
    await addSubscriber(email, name);
   
    console.log('Adding subscriber to Mailchimp:', email);

    //Generate a salt for more security
    const salt = crypto.randomBytes(16).toString('hex');
    // Create an email hash
    const emailHash = crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');

     //Create session data including user details
     const preliminarysessionData = {email, name, status: 'pending', salt };
     console.log(`Storing session data in Redis for Email Hash: ${emailHash}`);
  // Store the session data
    await redis.set(`prelimSession:${emailHash}`, JSON.stringify(preliminarysessionData), 'EX', 3600)
    // Store the email to hash and salt mapping. This will allow me to get access to the salt in other parts of the application
    await redis.set(`emailToHashMapping:${email}`, JSON.stringify({ emailHash, salt }), 'EX', 3600)

    res.status(200).json({message: "Subscription initiated. Please check your email to confirm. Don't see it, check spam!!", status: 'pending' });
   
    } catch (error) {
      console.error(`Error during subscription process for email: ${email}`, error);
      if (error.response) {
        console.error('Mailchimp error response:', error.response.body);
      }
      res.status(500).json({ error: 'Subscription failed' });
    }
}

