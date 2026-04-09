"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

import CheckoutForm from "./CheckoutForm";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

const CheckoutInitiator = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>("");
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | undefined>(
    undefined,
  );
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
        });
        if (!isMounted) return;
        if (!res.ok) {
          const errorData = await res.json();
          setError(
            "[CheckoutInitiator] API error: " +
              (errorData.error || res.statusText),
          );
          if (res.status === 401) {
            window.location.href = "/";
            return;
          }
          if (errorData.error === "Purchase already completed.") {
            setCheckoutCompleted(true);
            setError(
              "Purchase already completed. Check your email for confirmation and receipt.",
            );
            return;
          }
          return;
        }
        const data = await res.json();
        setEmail(data.customerEmail);
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("[CheckoutInitiator] Fetch error:", err);
        setError(
          "[CheckoutInitiator] Fetch error: " +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);
  const appearance: {
    theme: "flat" | "night" | "stripe";
    inputs?: "condensed" | "spaced";
  } = {
    theme: "night",
    inputs: "condensed",
  };
  if (error) {
    return (
      <>
        {checkoutCompleted ? (
          <div
            data-testid="purchase-completed-message"
            style={{
              color: "#fff",
              background: "#15803d",
              fontWeight: "bold",
              textAlign: "center",
              padding: 12,
              border: "2px solid #22c55e",
              borderRadius: 8,
              margin: 12,
              fontSize: 20,
            }}
          >
            Purchase already completed. Check your email for confirmation and
            receipt.
          </div>
        ) : (
          <div
            data-testid="checkout-error-message"
            style={{
              color: "#fff",
              background: "#b91c1c",
              fontWeight: "bold",
              textAlign: "center",
              padding: 12,
              border: "2px solid #f87171",
              borderRadius: 8,
              margin: 12,
              fontSize: 18,
            }}
          >
            Checkout failed to initiate: {error}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {clientSecret ? (
        <CheckoutElementsProvider
          stripe={stripePromise}
          options={{
            clientSecret,
            elementsOptions: { appearance },
          }}
        >
          <CheckoutForm email={email} />
        </CheckoutElementsProvider>
      ) : null}
    </>
  );
};
export default CheckoutInitiator;
