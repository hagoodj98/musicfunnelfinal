// app/components/CheckoutInitiator.client.jsx
"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import RememberMe from "./RememberMe";
import Timer from "./Timer";


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const CHECKOUT_WINDOW = 600; // 10 minutes or whatever time you choose

const CheckoutInitiator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      // Make the API call on the server (via your API route)
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session.");
      }

      const session = await response.json();
      const stripe = await stripePromise;
      const result = await stripe.redirectToCheckout({ sessionId: session.id });
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message);
      setLoading(false);
    }
  };
  const handleTimerExpire = () => {
    alert("Your checkout session has expired. Please check your email for a new purchase link.");
    // Optionally, you might redirect or update the UI here.
    window.location.href = "/landing"; // refresh the landing page
  };

  return (
    <div>
      <Timer initialTime={CHECKOUT_WINDOW} onExpire={handleTimerExpire}/>
      <RememberMe />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleCheckout} disabled={loading}>
        {loading ? "Redirecting..." : "Buy Fan Pack"}
      </button>
    </div>
  );
};
export default CheckoutInitiator;