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
    <div className="tw-w-full  tw-flex tw-justify-center">
      <MessageNotify notify={message} type={messageType} />
      <Button onClick={handleCheckout}  sx={{
                        // Normal (enabled) styles:
                        backgroundColor: "secondary.main",
                        color: "white",
                        width: "50%",
                        borderColor: "secondary.main",
                        "&:hover": {
                        backgroundColor: "#FDEAB6",
                        borderColor: "#FDEAB6",
                        color: "rgb(1, 10, 38, 0.8)",
                        },
                        // Disabled styles:
                        "&.Mui-disabled": {
                        // For example, a semi-transparent version of your secondary color
                        backgroundColor: "rgba(239, 76, 18, 0.6)",
                        color: "white",
                        borderColor: "rgba(239, 76, 18, 0.6)",
                        cursor: "not-allowed",
                        opacity: 1, // override default MUI disabled opacity if desired
                        },
                    }} disabled={loading}>
                      <span className="tw-font-header">
                        {loading ? "Redirecting to Stripe..." : "I Want One!"}
                      </span>
      </Button>
    </div>
  );
};
export default CheckoutInitiator;