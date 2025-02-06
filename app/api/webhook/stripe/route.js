import Stripe from "stripe";
import redis from "../../../utils/redis";

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
                return new Response(`Webhook Error: ${error.message}`, { status: 400 })
            }
            
                // Handle the event
            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutSessionCompleted(event.data.object);
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

async function handleCheckoutSessionCompleted(paymentIntent) {
    //to prevent my redis calls from failing, i want to check if paymentIntent includes metadata.sessionToken
    if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
        console.error("Missing sessionToken in payment metadata");
        return;
    }
    console.log(`Payment succeeded for ${paymentIntent.id}`);
     // Update Redis to mark the session as completed
     const sessionToken = paymentIntent.metadata.sessionToken;
    const sessionDataString = await redis.get(`session:${sessionToken}`);
    if (sessionDataString) {
        const sessionData = JSON.parse(sessionDataString);
        sessionData.checkoutStatus = 'completed';
        try {
            await redis.set(`session:${sessionToken}`, JSON.stringify(sessionData), 'EX', 3600);
            // Publish to Redis channel which WebSocket server is listening to
            console.log(`Publishing checkout update: ${JSON.stringify({ action: 'checkoutCompleted', sessionToken })}`);
            redis.publish('checkoutUpdates', JSON.stringify({ action: 'checkoutCompleted', sessionToken }));
        } catch (redisError) {
            console.error("Redis Error:", redisError);
        }
       
    }
}

async function handlePaymentCanceled(paymentIntent) {
     //to prevent my redis calls from failing, i want to check if paymentIntent includes metadata.sessionToken
    if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
        console.error("Missing sessionToken in payment metadata");
        return;
    }
    console.log(`Payment canceled for intent ${paymentIntent.id}`);
    const sessionToken = paymentIntent.metadata.sessionToken;
    // Update Redis to mark the session as canceled
    const sessionDataString = await redis.get(`session:${sessionToken}`);
    if (sessionDataString) {
        const sessionData = JSON.parse(sessionDataString);
        sessionData.checkoutStatus = 'canceled';
        try {
            await redis.set(`session:${sessionToken}`, JSON.stringify(sessionData), 'EX', 3600);
            // Publish to Redis channel which WebSocket server is listening to
            console.log(`Publishing checkout update: ${JSON.stringify({ action: 'checkoutCanceled', sessionToken })}`);
            redis.publish('checkoutUpdates', JSON.stringify({ action: 'checkoutCanceled', sessionToken }));
        } catch (redisError) {
            console.error("Redis Error:", redisError);
        }
       
    }
}

export function GET() {
    return new Response('Stripe webhook endpoint is live', { status: 200 });
  }
    