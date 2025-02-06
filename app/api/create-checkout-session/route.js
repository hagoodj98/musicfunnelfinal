import Stripe from "stripe";
import redis from "../../utils/redis";
import parseCookies from "../../utils/parseCookies";
import { error } from "console";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export async function POST(req, res) {
    try {
        //Parse cookies to access the sessionToken
        parseCookies(req);
        const csrfTokenClient= req.headers['CSRF-Token'];
        const sessionToken = req.cookies.sessionToken;
        if(!sessionToken) {
            return new Response(JSON.stringify({error: "Session token is required"}), {status: 401});
        }
        const sessionDataString = await redis.get(`session:${sessionToken}`);
        //Whenever I retrieve existing data, it is always good practice to check if exists.
        if (!sessionDataString) {
            return new Response(JSON.stringify({error: "Session not found or expired"}), {status: 401})
        }
        const sessionData = JSON.parse(sessionDataString);
        //Validate CSRF token. If this passes,then the user can continue. 
        if (csrfTokenClient !== sessionData.csrfToken) {
            return new Response(JSON.stringify({error: 'Invalid CSRF token'}), {status: 403});
        }
        //If the price ID ever changes in Stripe, my checkout will fail.
        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
            return new Response(JSON.stringify({ error: 'Price ID is not configured'}), {status:500});
        }

         // Define the checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],    
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                }
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/landing/thankyou`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/landing/cancel`,
            metadata: {
                sessionToken: sessionToken //Storing session token in metadata for retrieval in webhook
            }
        });
        
// **Generate the WebSocket token only after successful Stripe session creation. This token is used to get the sessionToken from the user that initiated the websocket connection with the API Gateway. With that session token I will process it some way, shape or form.

        const wsToken = crypto.randomBytes(16).toString("hex");
        await redis.set(`wsToken:${wsToken}`, sessionToken, "EX", 900); // 15-minute expiration

        //Update Redis with checkout session initiation
        const updatedSessionData= JSON.stringify({
            ...sessionData, 
            stripeSessionId: session.id, 
            checkoutStatus: 'initiated'
         });
// Save the updated session data back to Redis
//No other process can modify the key between commands.
//Ensures data consistency when handling session updates.
        await redis.multi()
            .set(`session:${sessionToken}`, updatedSessionData, 'EX', 3600)
            .exec();

        redis.publish('checkoutUpdates', JSON.stringify({ action: 'checkoutInitiated', sessionToken }));
        
        return new Response(JSON.stringify({id: session.id, sessionToken: sessionToken, wsToken: wsToken}), {status: 200});
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        return new Response(JSON.stringify({error: 'Unable to create checkout session'}), {status: 500});
    }
}