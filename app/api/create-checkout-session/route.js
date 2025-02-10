import Stripe from "stripe";
import redis from "../../utils/redis";
import { cookies } from "next/headers";// This brings in all cookies from the browser, making them avaiable for use in application

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export async function POST(req) {
    try {
        //This gets all available cookies
        //This code is like opening your secret sticker collection and reading what’s on each sticker.
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('sessionToken')?.value;//my session sticker/cookie tells the server who the user is.
        const csrfToken = cookieStore.get('csrfToken')?.value;//Another secret sticker/cookie that helps protect against attacks.
        
        if(!sessionToken) {
            return new Response(JSON.stringify({error: "Session token is required"}), {status: 401});
        }
        //This redis key was generated after check-status verifed the subscription status
        const sessionDataString = await redis.get(`session:${sessionToken}`);
        //Whenever I retrieve existing data, it is always good practice to check if exists.
        if (!sessionDataString) {
            return new Response(JSON.stringify({error: "Session not found or expired"}), {status: 401})
        }
        const sessionData = JSON.parse(sessionDataString);
        //Validate CSRF token. If this passes,then the user can continue. 
        if (csrfToken !== sessionData.csrfToken) {
            return new Response(JSON.stringify({error: 'Invalid CSRF token. Unauthorized! '}), {status: 403});
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
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}landing/thankyou`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}landing`,
            metadata: {
                sessionToken: sessionToken //Storing session token in metadata for retrieval in webhook
            }
        });
        
        //Extend sessionToken expiration if its about to expire. This time should be referencing the session lifespan once issued in /check-srtatus
        const sessionTTL = await redis.ttl(`session:${sessionToken}`);
        if (sessionTTL < 60) { //If session expires in less than a minute, extend it
            await redis.expire(`session:${sessionToken}`, 300); //Extend by 5 more minutes
        }

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
        
        return new Response(JSON.stringify({id: session.id, sessionToken: sessionToken}), {status: 200});
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        return new Response(JSON.stringify({error: 'Unable to create checkout session'}), {status: 500});
    }
}