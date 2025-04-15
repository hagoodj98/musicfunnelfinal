import Stripe from "stripe";
import { cookies } from './headersWrapper.js';
import { getSessionDataByToken, updateSessionData, HttpError, createCookie } from '../../utils/sessionHelpers.js';
import crypto from 'crypto';
import redis from '../../utils/redis.js';
import { sendPaymentLinkEmailViaMailchimp } from "../../utils/mailchimpHelpers.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('sessionToken')?.value;//my session sticker/cookie tells the server who the user is.
        const csrfToken = cookieStore.get('csrfToken')?.value;//Another secret sticker/cookie that helps protect against attacks.
        
        if (!sessionToken) {
            throw new HttpError("Session token is required", 401);
        }
        if (!csrfToken) {
            throw new HttpError("CSRF token is required", 401);
        }

        const sessionData = await getSessionDataByToken(sessionToken);//now sessionData is a parsed JSON Object
        const ttl = sessionData.rememberMe ? 604800 : 900;

        if (csrfToken !== sessionData.csrfToken) {
            throw new HttpError('Invalid CSRF token. Unauthorized!', 403);
        }
        const attemptsKey = `checkoutAttempts:${sessionToken}`;
        const attempts = await redis.incr(attemptsKey);
        if (attempts === 2) {
          await redis.expire(attemptsKey, 86400); // 24 hours in seconds
        }
       // If this is an extra checkout attempt (attempt 2 or 3), send a payment link via email.
        if (attempts === 3 || attempts === 4) {
          await redis.expire(attemptsKey, 86400); // lock out for 24 hours
          // Instead of creating a new checkout session, send a payment link email
          const paymentLink = await stripe.paymentLinks.create({
            line_items: [{
              price: process.env.STRIPE_PRICE_ID,
              quantity: 1,
            }],
            after_completion: {
              type: 'redirect',
              redirect: { url: 'https://jaiquezmusic.com/landing/thankyou'}
            },
            billing_address_collection: 'required', //Set to 'required' to collect billing address
            shipping_address_collection: {
                allowed_countries: ['US'], // Specify the countries to which I am willing to ship
            },
            metadata: {
                sessionToken: sessionToken
            }
          });
          // Send the payment link via email.
          const userEmail = sessionData.email;
          await sendPaymentLinkEmailViaMailchimp(userEmail, paymentLink.url);
          throw new HttpError("Too many checkout attempts. Check your email! We sent a payment link to your email if you wanted to make a purchase.", 429);
        }
        // If attempts are 4 or more, do not send any new payment link.
        if (attempts >= 4) {
            throw new HttpError("No more payment links can be generated in a 24 hour span. Please check your email again for the link. If you need assistance, you can find my email shown below  ⬇️. Sorry for the inconvience.", 429);
        }
        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
            throw new HttpError('Price ID is not configured', 500);
        }

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
            success_url: "https://jaiquezmusic.com/landing/thankyou",
            cancel_url: "https://jaiquezmusic.com/landing",
            billing_address_collection: 'required', //Set to 'required' to collect billing address
            shipping_address_collection: {
                allowed_countries: ['US'], // Specify the countries to which I am willing to ship
            },
            expires_at: expiresAt, //When I want this session to expire automatically
            metadata: { 
                sessionToken: sessionToken, 
            }
        });

const newCsrfToken = crypto.randomBytes(24).toString('hex');

        const updatedSessionData = {
            ...sessionData, 
            stripeSessionId: session.id, 
            checkoutStatus: 'initiated',
            csrfToken: newCsrfToken,
        };

        await updateSessionData(sessionToken, updatedSessionData, ttl);

        const sessionCookie = createCookie('sessionToken', sessionToken, {maxAge: ttl, sameSite: 'lax'});

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