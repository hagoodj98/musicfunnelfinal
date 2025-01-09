import Stripe from "stripe";
import redis from "../../utils/redis";
import parseCookies from "../../utils/parseCookies";
import { error } from "console";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req, res) {

    try {
        //Parse cookies to access the sessionToken
        parseCookies(req);
        const sessionToken = req.cookies.sessionToken;

        if(!sessionToken) {
            return res.status(401).json({error: "Session token is required" });
        }
         // Define the checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],    
            line_items: [
                {
                    price: 'price_1Qa8KSLbkXiHlM808dxEGruU',
                    quantity: 1,
                }
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/landing/thankyou?sessionToken=${sessionToken}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/landing/cancel`
        });
        
        return res.status(200).json({id: session.id});
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        return res.status(500).json({error: 'Unable to create checkout session' });
        
    }
}