"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

import CheckoutForm from "./CheckoutForm";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

const CheckoutInitiator = () => {
  const [email, setEmail] = useState("");
  const clientSecret = useMemo(async () => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
    });
    const data = await res.json();
    const customerEmail = data.customerEmail;
    setEmail(customerEmail);

    return data.clientSecret;
  }, []);
  const appearance: {
    theme: "flat" | "night" | "stripe";
    inputs?: "condensed" | "spaced";
  } = {
    theme: "night",
    inputs: "condensed",
  };
  return (
    <>
      <CheckoutElementsProvider
        stripe={stripePromise}
        options={{
          clientSecret: clientSecret,
          elementsOptions: { appearance },
        }}
      >
        <CheckoutForm email={email} />
      </CheckoutElementsProvider>
    </>
  );
};
export default CheckoutInitiator;
