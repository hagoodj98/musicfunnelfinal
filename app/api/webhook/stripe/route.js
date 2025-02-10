import Stripe from "stripe";
import redis from "../../../utils/redis";
import axios from "axios";

//Purpose: Next.js automatically parses incoming request bodies and converts them into JSON or a query object. For Stripe webhooks, I need to access the raw request body as a buffer to verify the webhook signature correctly. Disabling the default body parser lets you manually handle the incoming request data as raw bytes.
export const config = {
    api: {
      bodyParser: false,
    },
  };

export async function POST(req) {
        const  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        try {
// This method is used to read the complete request body as an ArrayBuffer. An ArrayBuffer is a generic fixed-length container for binary data in JavaScript.
            const buffer = await req.arrayBuffer(); 
//Converts the ArrayBuffer to a Node.js Buffer. Stripe’s SDK requires the raw body as a Buffer for signature verification. The Buffer class in Node.js is used to handle raw binary data.
            const rawBody = Buffer.from(buffer);
//Stripe sends a signature in the request headers of each webhook event. This signature is used to verify that the events sent to the webhook are legitimately from Stripe and not from a third party.This extracts the stripe-signature header from the incoming request, which is crucial for the next step.
            const sig= req.headers.get('stripe-signature');
            const webhookSecret= process.env.STRIPE_WEBHOOK_SECRET;
            
            // Verify the webhook
            let event;

            try {
//This method from the Stripe Node SDK takes three arguments. My endpoint's secret (stripe_webhook_secret), which I obtain from the Stripe dashboard. This secret is unique to each webhook endpoint and is used to generate and validate the signature. The function attempts to reconstruct the event using the provided body and signature along with my endpoint’s secret. If the signature does not match (indicating potential tampering or an issue in the transmission), an error is thrown. If it matches, it means the event is indeed from Stripe and hasn’t been altered during transmission.
                event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
            } catch (error) {
// Signature verification failed
                console.error("Stripe webhook signature verification failed:", error.message);
// 401 Unauthorized: The signature is invalid
                return new Response(`Webhook Error: ${error.message}`, { status: 401 })
            }
            
// Handle the event, now that at this point in the code i know the event or the incoming webhook is legit. My webhook is configured to listen for three different events and processes the event's object.

/* The event or payload coming from Stripe looks something like this
*************
{
  "id": "evt_1PH9HU2eZvKYlo2CrSrLx8y1",
  "object": "event",
  "api_version": "2019-02-19",
  "created": 1715885036,
  "data": {
    "object": {
      "id": "card_1PH9HQ2eZvKYlo2CcwDOwdFV",
      "last4": "4242",
      "metadata": {},
      "name": "user@gmail.com",
    }
  },
  "type": "customer.source.created"
}
********************  
*/

//Based on the type, the following code executes. I want access to the object because it has the metadata key, which is the sessionToken I set in /create-checkout-session
console.log(event);

            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutSessionCompleted(event.data.object);
                    break;
//This event is triggered when a Stripe Checkout Session expires. Typically, if the user doesn’t complete the session within the allotted time, the session will expire automatically.
                case 'checkout.session.expired':
                    await handleCheckoutSessionExpired(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            } 
            return new Response(JSON.stringify({received: true}), { status: 200 });
        } catch (error) {
            console.error(`Webhook Error: ${error.message}`);
             // 500 Internal Server Error: Something went wrong on our end.
            return new Response(`Webhook Error: ${error.message}`, {status: 500 });
        }
}

//Each event function checks if metadata exists, if it does then get the value and set it equal to sessionToken. This is how I use redis to update the data depending on the incoming event caused by the user, using a helper function called updateSessionStatus.

/////////////////////
async function handleCheckoutSessionExpired(paymentIntent) {
    if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
        console.error("Missing sessionToken in checkout session metadata");
        return;
    }
    const sessionToken = paymentIntent.metadata.sessionToken;
    console.log(`Checkout session expired for ${paymentIntent.id}`);
    await updateSessionStatus(sessionToken, 'expired');
}
//////////////////////////
async function handleCheckoutSessionCompleted(paymentIntent) {
    console.log(paymentIntent);

    if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
        console.error("Missing sessionToken in payment metadata");
        return;
    }
    const sessionToken = paymentIntent.metadata.sessionToken;
    console.log(`Payment succeeded for ${paymentIntent.id}`);
    // Update the session status in Redis to 'completed'
    await updateSessionStatus(sessionToken, 'completed');
     // Retrieve updated session data from Redis if needed (or use the original sessionData if available)
    const sessionDataString = await redis.get(`session:${sessionToken}`);
    if (sessionDataString) {
        const sessionData = JSON.parse(sessionDataString);
        await triggerZapier(sessionData);
    }
}
/////////////////////////

//helper function to update the session status. This avoids code duplication and makes future changes easier. This function is called inside the event functions, and the event functions are called in the switch statements according to its case. This function takes two arguments, the sessionToken arugment comes from the events' payload(event.data.object). Inside of this object lies the sessionToken thats associated and responsible for the Stripe Form's initial render. The second argument comes from or is set in the event functions. Each event function checks if metadata exists, this is important as to keep track of who initiated the stripe form. If metadata exists, then extract the metadata's sessionToken and put it into the first parameter here. And based on which event function was called, depending on the switch statements, set the 2nd parameter to one word that describes the event, such as cancel, completed, expired. 
async function updateSessionStatus(sessionToken, newStatus) {
    //Take the sessionToken found in the metadata and get the redis key associated.
    const sessionDataString = await redis.get(`session:${sessionToken}`);

    //If it exists, then parse the JSON. Update the checkoutStatus from the parsed JSON and set it to the second parameter. Then update the redis with the newly tracked status based on interaction of the stripe form. 
    if (sessionDataString) {
        const sessionData = JSON.parse(sessionDataString);
        sessionData.checkoutStatus = newStatus;
        try {
            await redis.set(`session:${sessionToken}`, JSON.stringify(sessionData), 'EX', 3600);
        } catch (redisError) {
            console.error("Redis Error:", redisError);
        }
    } else {
        console.warn(`No session data found for sessionToken: ${sessionToken}`);
    }
}

// Helper function to trigger Zapier via an axios POST request
async function triggerZapier(sessionData) {
    try {
        const zapierWebhookURL= process.env.ZAPIER_WEBHOOK;
        console.log('This is what is avaibale as session data. Data that is sent to Zapier in a payload.');
        
        const payload = {
            email: sessionData.email,
            name: sessionData.name,
            status: 'completed',
            sessionToken: sessionData.sessionToken,
        };
        //This API post request is sending data to the zapier webhook url. The data that is being sent is the payload, and the configuration is letting the server know what type of data being sent. The configuration part is crucial because without it, the server might not know how to properly interpret it.
        const response = await axios.post(zapierWebhookURL, payload, {
            headers: {
                'Content-Type': 'application/json' //This value indicates that the data being sent is in JSON format. This can be known as the label of the message(payload)
            }
        });
        //For logging, taking a look at the response being sent to Zapier
        console.log('Zapier response:', response.data);
    } catch (error) {
        console.error('Error triggering Zapier:', error.message);
    }
}
export function GET() {
    return new Response('Stripe webhook endpoint is live', { status: 200 });
  }
    