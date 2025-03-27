import Stripe from "stripe";
import { updateMailchimpTag, updateMailchimpAddress } from '../../../utils/mailchimpHelpers.js';
import { getSessionDataByToken, updateSessionData, HttpError } from "../../../utils/sessionHelpers.js";

export const config = {
    api: {
      bodyParser: false,
    },
  };

export async function POST(req) {
    const  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    try {

        const buffer = await req.arrayBuffer(); 
        const rawBody = Buffer.from(buffer);

        const sig= req.headers.get('stripe-signature');
        const webhookSecret= process.env.STRIPE_WEBHOOK_SECRET;
        // Verify the webhook
        let event;
        try {

            event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } catch (error) {
// Signature verification failed
            console.error("Stripe webhook signature verification failed:", error.message);
// 401 Unauthorized: The signature is invalid
            return new Response(`Webhook Error: ${error.message}`, { status: 401 })
        }
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;

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
  
        if (error instanceof HttpError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        return new Response(`Webhook Error: ${error.message}`, {status: 500 });
    }
    }

/////////////////////
async function handleCheckoutSessionExpired(paymentIntent) {
    if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
        console.error("Missing sessionToken in checkout session metadata");
    }
    
    const sessionToken = paymentIntent.metadata.sessionToken;

    const sessionData = await getSessionDataByToken(sessionToken);
    if (sessionData && sessionData.checkoutStatus === 'completed') {
        return new Response(JSON.stringify({ message: "Session already completed." }), { status: 200 });
    }
    
     // Determine TTL based on rememberMe flag:
     const ttl = sessionData.rememberMe ? 604800 : 900;
  
    // Update the checkoutStatus property on the retrieved session data
    sessionData.checkoutStatus = 'cancelled';
    sessionData.message = 'Your checkout session either cancelled or timedout. Please try again later';
// Now call updateSessionData with the updated session object
    await updateSessionData(sessionToken, sessionData, ttl);

}
//////////////////////////
async function handleCheckoutSessionCompleted(paymentIntent) {
    if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
        console.error("No sessionToken in payment metadata - possibly Payment Link purchase. Skipping session-based logic.");
        throw new HttpError('Missing sessionToken in payment metadata"', 400);
        return;
    }
    const sessionToken = paymentIntent.metadata.sessionToken;
// Retrieve current session data (using your helper)
    const sessionData = await getSessionDataByToken(sessionToken);

    sessionData.checkoutStatus = 'completed';
    sessionData.message = 'Your checkout session has processed successfully. ';
    const ttl = sessionData.rememberMe ? 604800 : 900;

    await updateSessionData(sessionToken, sessionData, ttl);

    if (paymentIntent.shipping_details && paymentIntent.shipping_details.address && sessionData.email) {
   
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
    