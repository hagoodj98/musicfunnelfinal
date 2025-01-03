'use client';
import { useEffect, useState } from "react";
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const StripeForm = () => {

const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

//This handles the checkout session from the back-end
const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
        //call the backend to create checkout session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error('Network response was not Ok.');
        }
        const session = await response.json();

        if (session.id) {
            //redirect user to Stripe checkout page
            const stripe = await stripePromise;
            const result = await stripe.redirectToCheckout({ sessionId: session.id });
            if (result.error) {
                throw result.error;
            } else {
                throw new Error('Session ID not found');
            }
        }
        } catch (error) {
            console.error('Error during checkout:', error);
            setError('Failed to redirect to checkout. Please try again.');
            setLoading(false);        
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="border-2 p-10 flex">
        <section className="flex flex-col">
            <div>
                <p>price</p>
            </div>
            <button className="bg-white" disabled={loading}  onClick={handleCheckout}>
                {loading ? 'Redirecting to Checkout...' : 'Buy Fan Pack'}
            </button>
        </section>
       
        {error && <p style={{color: 'red' }}>{error}</p>}
    </div>
  )
}

export default StripeForm;
