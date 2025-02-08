'use client';

import { useEffect, useState } from "react";
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const CHECKOUT_TTL = 900; //15 Minutes (matching wsToken expiration)

const StripeForm = ({rememberMe}) => {

const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

// Function to get CSRF token from cookies

//This handles the checkout session creation
const handleCheckout = async () => {
    if (timeLeft <= 0) {
        alert("Your session has expired. Please restart the checkout process.");
        return;
    }
    setLoading(true);
    setError('');
    const csrfToken = getCsrfToken(); //Get CSRF from cookies
    try {
        //call the backend to create checkout session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken, //Include CSRF token in request headers
            },
            body: JSON.stringify({rememberMe})
        });
        if (!response.ok) {
            throw new Error('Network response was not Ok.');
        }
        const session = await response.json();
        if (session.id) {
            //redirect user to Stripe checkout page
            const stripe = await stripePromise; //instance once the library is fully loaded and ready to interact with
            //The result variable will work as long as the session.id is present, which means that everything that happened within the session variable inside the create-checkout-session was successful.
            const result = await stripe.redirectToCheckout({ sessionId: session.id });
            //Even though a session ID is successfully created, there are scenarios where the redirection might fail: network interruptions, browser restrictions, or conflicts in JavaScript execution that might prevent the redirection from occurring as expected.
            if (result.error) {
                throw result.error;
            }
        }
        
        } catch (error) {
            console.error('Error during checkout:', error);
            setError('Failed to redirect to checkout. Please try again.');
                
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
