'use client';
import { useEffect, useState } from "react";
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const StripeForm = () => {

const [loading, setLoading] = useState(false);

//This handles the checkout session from the back-end
const handleCheckout = async () => {
    setLoading(true);
    try {
        //call the backend to create checkout session
        const response = await axios.post('/api/create-checkout-session')

        const session = await response.json();

        if (session.id){
            //redirect user to Stripe checkout page
            const stripe = await stripePromise;
            await stripe.redirectToCheckout({ sessionId: session.id });
        }
        } catch (error) {
            console.error('Error during checkout:', error);
            setLoading(false);        
        }
    };

  return (
    <div>
        <button disabled={loading} onClick={handleCheckout}>
            {loading ? 'Redirecting to Checkout...' : 'Buy Fan Pack'}
        </button>
    </div>
  )
}

export default StripeForm;
