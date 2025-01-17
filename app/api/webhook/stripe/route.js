import Stripe from "stripe";
import redis from "../../../utils/redis";
import { buffer } from "next";



export const config = {
    api: {
      bodyParser: false,
    },
  };
  


export async function POST(req, res) {
       
        const  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        try {
                // Read the raw request body as a buffer
            const buffer = await req.arrayBuffer()
            const rawBody = Buffer.from(buffer)

            const sig= req.headers.get('stripe-signature');
            const webhookSecret= process.env.STRIPE_WEBHOOK_SECRET;
            
            // Verify the webhook
            let event;

            try {
                event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
            } catch (error) {
                 // Signature verification failed
                return new Response(`Webhook Error: ${err.message}`, { status: 400 })
            }
            
                // Handle the event
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await handlePaymentSucceeded(event.data.object);
                break;
                case 'payment_intent.canceled':
                    await handlePaymentCanceled(event.data.object);
                break;
                // Add more event types as needed
                default:
                console.log(`Unhandled event type ${event.type}`);
            }
            return new Response(JSON.stringify({received: true}), { status: 200 });
        } catch (error) {
            console.error(`Webhook Error: ${error.message}`);
            return new Response(`Webhook Error: ${error.message}`, {status: 400 });
        }
    
}

async function handlePaymentSucceeded(paymentIntent) {
    console.log(`Payment succeeded for ${paymentIntent.id}`);
     // Update Redis to mark the session as completed
    const sessionDataString = await redis.get(`session:${paymentIntent.metadata.sessionToken}`);
    if (sessionDataString) {
        const sessionData = JSON.parse(sessionDataString);
        sessionData.checkoutStatus = 'completed';
        await redis.set(`session:${paymentIntent.metadata.sessionToken}`, JSON.stringify(sessionData), 'EX', 3600);
    }
}

async function handlePaymentCanceled(paymentIntent) {
    console.log(`Payment canceled for intent ${paymentIntent.id}`);
    // Update Redis to mark the session as canceled
    const sessionDataString = await redis.get(`session:${paymentIntent.metadata.sessionToken}`);
    if (sessionDataString) {
        const sessionData = JSON.parse(sessionDataString);
        sessionData.checkoutStatus = 'canceled';
        await redis.set(`session:${paymentIntent.metadata.sessionToken}`, JSON.stringify(sessionData), 'EX', 3600);
    }
}

export function GET() {
    return new Response('Stripe webhook endpoint is live', { status: 200 });
  }
    