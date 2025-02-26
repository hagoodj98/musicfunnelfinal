import Stripe from "stripe";
import { updateMailchimpTag, updateMailchimpAddress } from '../../../utils/mailchimpHelpers';
import { getSessionDataByToken, updateSessionData } from "../../../utils/sessionHelpers";
import { HttpError } from "../../../utils/sessionHelpers";
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
                return new Response(JSON.stringify({message: 'Event type not handled'}), {status:200});
        } 
        return new Response(JSON.stringify({received: true}), { status: 200 });
    } catch (error) {
        console.error(`Webhook Error: ${error.message}`);
    // 500 Internal Server Error: Something went wrong on our end.
        if (error instanceof HttpError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        return new Response(`Webhook Error: ${error.message}`, {status: 500 });
    }
    }

//Each event function checks if metadata exists, if it does then get the value and set it equal to sessionToken. This is how I use redis to update the data depending on the incoming event caused by the user, using a helper function called updateSessionStatus.

/////////////////////
async function handleCheckoutSessionExpired(paymentIntent) {
    if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
        console.error("Missing sessionToken in checkout session metadata");
    }
    
    const sessionToken = paymentIntent.metadata.sessionToken;
    console.log(`Checkout session expired for ${paymentIntent.id}`);
    

    // Use the helper to update the checkout status to 'expired'
    // Retrieve current session data using your helper
    
    const sessionData = await getSessionDataByToken(sessionToken);
    if (sessionData && sessionData.checkoutStatus === 'completed') {
        console.log("Session already completed, ignoring expired event.");
        return new Response(JSON.stringify({ message: "Session already completed." }), { status: 200 });
    }
    
     // Determine TTL based on rememberMe flag:
     const ttl = sessionData.rememberMe ? 200 : 120;
  
    // Update the checkoutStatus property on the retrieved session data
    sessionData.checkoutStatus = 'cancelled';
    sessionData.message = 'Your checkout session either cancelled or timedout. Please try again later';
// Now call updateSessionData with the updated session object
    await updateSessionData(sessionToken, sessionData, ttl);
    console.log("Session updated as expired for sessionToken:", sessionToken);
}
//////////////////////////
async function handleCheckoutSessionCompleted(paymentIntent) {
    console.log(paymentIntent);//For debugging purposes
    if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
        console.error("No sessionToken in payment metadata - possibly Payment Link purchase. Skipping session-based logic.");
        throw new HttpError('Missing sessionToken in payment metadata"', 400);
        return;
    }
    const sessionToken = paymentIntent.metadata.sessionToken;
    console.log(`Payment succeeded for ${paymentIntent.id}`);
// Retrieve current session data (using your helper)
    const sessionData = await getSessionDataByToken(sessionToken);
    //updating the sessionData JSON object. Grab its checkoutStatus property and change it to 'completed'
    sessionData.checkoutStatus = 'completed';
    sessionData.message = 'Your checkout session has processed successfully. ';
    const ttl = sessionData.rememberMe ? 200 : 120;
// Directly update the checkout status. This line of code is what middleware.js is checking for the checoutStatus property we just set/updated. Now we store that updated status back in redis. 
console.log(sessionData, "hi I am in stripe webhook");

    await updateSessionData(sessionToken, sessionData, ttl);
 // ***** Call Mailchimp to update the mailing address *****. Extract shipping details and the email. Since I already know that shipping_details and the address exist, its always good to check if the properties exists so that there won't be any potential errors. Its almost similiar to lines 85 and 96. Mailchimp expects a JSON object. So looking at the payload of the checkout session complted event, we want to get the address object from the shipping_details property. In this conditional statement, if shipping_details and shipping_details.address exists, also check if sessiionData JSON has a key 'email' stored in Redis. Since I expect them to always have these properties, the paymentIntent.shipping_details.address and sessionData.email are the two parameters that go into the updateMailchimpAddress helper function that we imported in to make an API call to mailchimp. 
    if (paymentIntent.shipping_details && paymentIntent.shipping_details.address && sessionData.email) {
            // Format the address correctly for Mailchimp. Mailchimp expects an object with keys such as addr1,addr2, etc
        const formattedAddress = {
            addr1: paymentIntent.shipping_details.address.line1,
            addr2: paymentIntent.shipping_details.address.line2 || "",
            city: paymentIntent.shipping_details.address.city,
            state: paymentIntent.shipping_details.address.state,
            zip: paymentIntent.shipping_details.address.postal_code,
            country: paymentIntent.shipping_details.address.country,
        };
        //This helper function gets the email, and the JSON object that mailchimp expects
        await updateMailchimpAddress(sessionData.email, formattedAddress);
    }
    // /NEW: Update the subscriber's tag to "Fan Purchaser" *****
    if (sessionData.email) {
        await updateMailchimpTag(sessionData.email, 'Fan Purchaser', 'active');
    }
}
/////////////////////////

export function GET() {
    return new Response('Stripe webhook endpoint is live', { status: 200 });
  }
    