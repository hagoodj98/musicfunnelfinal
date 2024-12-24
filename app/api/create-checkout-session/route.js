import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
         // Define the checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],    
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Fan Pack',
                        },
                        unit_amount: 900
                    },
                    quantity: 1,
                }
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/landing/thankyou`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/landing/cancel`
        });

        return new Response(JSON.stringify({id: session.id }), {status: 200 });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        return new Response(JSON.stringify({error: 'Unable to create checkout session' }), {status: 500});
        
    }


}