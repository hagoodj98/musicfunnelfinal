// app/components/CheckoutInitiator.client.jsx
"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import MessageNotify from "./MessageNotify";
import Button from '@mui/material/Button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutInitiator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage]=useState('');
  const [messageType, setMessageType]=useState('');

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
      const session = await response.json();
  
      if (!response.ok) {
        setMessage(`${session.error || "Failed to create checkout session."}#${Date.now()}`);
        setMessageType('error');
      }

      const stripe = await stripePromise;
      const result = await stripe.redirectToCheckout({ sessionId: session.id });
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
     
      setLoading(false);
    }
  };

  return (
    <div>
      <MessageNotify notify={message} type={messageType} />
      <Button onClick={handleCheckout} className=' tw-bg-lighterblue tw-p-2 hover:tw-bg-yellow hover:tw-border-yellow hover:tw-text-lighterblue tw-text-white' disabled={loading}>
        {loading ? "Redirecting..." : "Buy Fan Pack"}
      </Button>
    </div>
  );
};
export default CheckoutInitiator;