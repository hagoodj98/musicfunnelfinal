import Stripe from "stripe";
import { cookies } from "next/headers";// This brings in all cookies from the browser, making them avaiable for use in application
import { getSessionDataByToken, updateSessionData, HttpError, createCookie } from '../../utils/sessionHelpers';
import crypto from 'crypto';
import redis from '../../utils/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
//This gets all available cookies
//This code is like opening your secret sticker collection and reading what’s on each sticker.
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('sessionToken')?.value;//my session sticker/cookie tells the server who the user is.
        const csrfToken = cookieStore.get('csrfToken')?.value;//Another secret sticker/cookie that helps protect against attacks.
        
        if (!sessionToken) {
            throw new HttpError("Session token is required", 401);
        }
        if (!csrfToken) {
            throw new HttpError("CSRF token is required", 401);
        }
//This redis key was generated after check-status verifed the subscription status
        const sessionData = await getSessionDataByToken(sessionToken);//now sessionData is a parsed JSON Object
//In the event a user abandons the stripe form and tries to start a new one.
        
          
//Validate CSRF token. If this passes,then the user can continue. This prevents CSRF attacks
        if (csrfToken !== sessionData.csrfToken) {
            throw new HttpError('Invalid CSRF token. Unauthorized!', 403);
        }
         // Limit checkout session attempts.
        // It builds a key called checkoutAttempts:<sessionToken> using the user’s session token. This key uniquely tracks how many times this user (or session) has tried to start a checkout session.
        const attemptsKey = `checkoutAttempts:${sessionToken}`;
        //It uses redis.incr(attemptsKey) to increase the counter by 1 each time the user makes an attempt.Think of it like a counter that goes up by one every time the user clicks “Buy Now.”
        const attempts = await redis.incr(attemptsKey);
        //When the counter hits 2 (i.e. on the second attempt), it sets the counter to automatically expire after 3600 seconds (1 hour) using redis.expire(attemptsKey, 3600). This means that if the user doesn’t try again within an hour, the counter resets, and they get a fresh start.
        if (attempts === 2) {
            // Set an expiration for the counter (for example, 1 hour)
            await redis.expire(attemptsKey, 3600);
        }
        // In simple terms, if the user tries more than 5 times within an hour, the system stops them and tells them to check their email (or try again later).
        if (attempts > 3) {
            throw new HttpError("🛑Nope! Too many checkout attempts. If you want to make another purchaser, check your email.", 429);
        }
///////The CSRF token protects the following process
        const ttl = sessionData.rememberMe ? 604800 : 3600;
//If the price ID ever changes in Stripe, my checkout will fail.
        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
            throw new HttpError('Price ID is not configured', 500);
        }

        // Calculate expiration timestamp: 30 minutes from now in Unix time (seconds). Math.floor(Date.now() / 1000) gets the current time in seconds (Unix timestamp). Adding 30 * 60 (which equals 1800 seconds) sets the expiration 30 minutes into the future.
        const expiresAt = Math.floor(Date.now() / 1000) + (30 * 60);

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
            success_url: "http://localhost:3000/landing/thankyou",
            cancel_url: "http://localhost:3000/landing",
            billing_address_collection: 'required', //Set to 'required' to collect billing address
            shipping_address_collection: {
                allowed_countries: ['US'], // Specify the countries to which I am willing to ship
            },
            expires_at: expiresAt, //When I want this session to expire automatically
            metadata: { 
                sessionToken: sessionToken, ////Storing session token in metadata for retrieval in webhook. Including the old cookie in the metadata allows me to identify the original session that initiated the checkout. This is especially useful in the webhook, where i might need to correlate the Stripe session with the user’s session data in Redis.

            }
        });
//Only rotate the CSRF cookie (more secure): Since i am creating new CSRF cookie while leaving the sessionToken cookie as is, so the middleware, stripe webhook can update the same session with the same sessionToken
const newCsrfToken = crypto.randomBytes(24).toString('hex');
//// Update session data with the stripeSessionId and checkoutStatus and the new csrf token that was rotated for extra security. Read the following comments on why this was done
        const updatedSessionData = {
            ...sessionData, 
            stripeSessionId: session.id, 
            checkoutStatus: 'initiated',
            csrfToken: newCsrfToken
        };
// Save the updated session data back to Redis. Ensures data consistency when handling session updates. This also ensures that the session in Redis will now expire after the appropriate duration based on whether the user selected “Remember Me” which also requires updating the cookie. Which means we can create a new set of cookies because the ttl that we got if the users selected the rememberMe means no only do we update the session with the new ttl, but also set the cookies with the same ttl. Because we do not want the cookie to expire before the session data. That is why we are generating new cookies. We want the session data and the cookies in sync
        await updateSessionData(sessionToken, updatedSessionData, ttl);

        //All we are doing here is updating the sessionToken ttl when we update the session data so all the cookies and session data expire at the same time
        const sessionCookie = createCookie('sessionToken', sessionToken, {maxAge: ttl});
//When you rotate the token (generate a new value) and then send a new cookie with that same name, the browser overwrites the old cookie with the new value. This means that any attacker who might have captured the old token no longer has a valid token because it’s been replaced. The new csrf token comes into play for subsequent request. Before any future state changes in this application will check for this new csrf first, not the old csrf token. This help prevent CSRF attacks too.
        const csrfCookie = createCookie('csrfToken', newCsrfToken, {maxAge: ttl, sameSite: 'lax'});

        return new Response(JSON.stringify({id: session.id}), {status: 200, headers: { 'Set-Cookie': [sessionCookie, csrfCookie] }});
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        if (error instanceof HttpError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        return new Response(JSON.stringify({error: 'Unable to create checkout session'}), {status: 500});
    }
}