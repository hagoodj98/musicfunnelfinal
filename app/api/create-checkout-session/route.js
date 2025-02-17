import Stripe from "stripe";
import { cookies } from "next/headers";// This brings in all cookies from the browser, making them avaiable for use in application
import { getSessionDataByToken, updateSessionData, HttpError, createCookie, generateTokenAndSalt } from '../../utils/sessionHelpers';

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
//This redis key was generated after check-status verifed the subscription status
        const sessionData = await getSessionDataByToken(sessionToken);//now sessionData is a parsed JSON Object
        
//Validate CSRF token. If this passes,then the user can continue. This prevents CSRF attacks
        if (csrfToken !== sessionData.csrfToken) {
            throw new HttpError('Invalid CSRF token. Unauthorized!', 403);
        }
///////The CSRF token protects the following process
        const ttl = sessionData.rememberMe ? 604800 : 3600;
//If the price ID ever changes in Stripe, my checkout will fail.
        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
            throw new HttpError('Price ID is not configured', 500);
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
            success_url: "http://localhost:3000/landing/thankyou",
            cancel_url: "http://localhost:3000/landing",
            billing_address_collection: 'required', //Set to 'required' to collect billing address
            shipping_address_collection: {
                allowed_countries: ['US'], // Specify the countries to which I am willing to ship
            },

            metadata: { sessionToken }//Storing session token in metadata for retrieval in webhook. Including the old cookie in the metadata allows me to identify the original session that initiated the checkout. This is especially useful in the webhook, where i might need to correlate the Stripe session with the user’s session data in Redis.
        });
//token rotation (more secure): Since i am creating new cookies, might as well generate new tokens
        const { sessionToken: newSessionToken, csrfToken: newCsrfToken } = generateTokenAndSalt();
//// Update session data with the stripeSessionId and checkoutStatus
        const updatedSessionData = {
            ...sessionData, 
            stripeSessionId: session.id, 
            checkoutStatus: 'initiated',
            csrf: newCsrfToken
        };
// Save the updated session data back to Redis. No other process can modify the key between commands. Ensures data consistency when handling session updates. This also ensures that the session in Redis will now expire after the appropriate duration based on whether the user selected “Remember Me.”
        await updateSessionData(newSessionToken, updatedSessionData, ttl);

        //When you rotate the token (generate a new value) and then send a new cookie with that same name, the browser overwrites the old cookie with the new value. This means that any attacker who might have captured the old token no longer has a valid token because it’s been replaced.
        const sessionCookie = createCookie('sessionToken', newSessionToken, {maxAge: ttl, sameSite: 'lax'});
        const csrfCookie = createCookie('csrf', newCsrfToken, {maxAge: ttl, sameSite: 'lax'});

        return new Response(JSON.stringify({id: session.id, sessionToken}), {status: 200, headers: { 'Set-Cookie': [sessionCookie, csrfCookie] }});
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        if (error instanceof HttpError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        return new Response(JSON.stringify({error: 'Unable to create checkout session'}), {status: 500});
    }
}