"use client";

import { useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe.js using your publishable key.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function ClientStripeRedirect({ sessionId }) {
    const [loading, setLoading] = useState(false);



  useEffect(() => {
    async function redirect() {
        setLoading(true);
        const stripe = await stripePromise;
        const result = await stripe.redirectToCheckout({ sessionId });
        if (result.error) {
            console.error("Stripe redirect error:", result.error);
        }
    }
    redirect();
  }, [sessionId]);

  return (
    <div>
        <button className="bg-white" disabled={loading}  onClick={handleCheckout}>
        {loading ? 'Redirecting to Checkout...' : 'Buy Fan Pack'}
        </button>
    </div>
  );
}