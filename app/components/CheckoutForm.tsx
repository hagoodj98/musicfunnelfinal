import React, { useCallback, useState } from "react";
import {
  PaymentElement,
  BillingAddressElement,
  useCheckout,
  ShippingAddressElement,
  type StripeUseCheckoutResult,
} from "@stripe/react-stripe-js/checkout";
import type { StripeAddressElementChangeEvent } from "@stripe/stripe-js";
import TextInput from "./ui/TextInput";
import BrandButton from "./ui/BrandButton";
import { CircularProgress } from "@mui/material";
import { isValidAddressSchema } from "../utils/inputValidation";
import { z } from "zod/v4";

type ShippingAddressState = {
  name: string;
  address: {
    line1: string;
    line2?: string;
    postal_code: string;
    city: string;
    state: string;
  };
};

const CheckoutForm = ({ email }: { email: string }) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checkoutState = useCheckout() as StripeUseCheckoutResult;
  const EMPTY_SHIPPING_ADDRESS: ShippingAddressState = {
    name: "",
    address: {
      line1: "",
      line2: "",
      postal_code: "",
      city: "",
      state: "",
    },
  };
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressState>(
    EMPTY_SHIPPING_ADDRESS,
  );
  const [isShippingComplete, setIsShippingComplete] = useState(false);

  const validateShippingAddress = useCallback(
    async (shippingAddress: ShippingAddressState) => {
      try {
        const userAddress = isValidAddressSchema.parse({
          line1: shippingAddress.address.line1,
          line2: shippingAddress.address.line2,
          city: shippingAddress.address.city,
          state: shippingAddress.address.state,
          postal_code: shippingAddress.address.postal_code,
        });
        const response = await fetch("/api/validate-shipping-address", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userAddress),
        });
        if (!response.ok) {
          const errorResponse = await response.json();
          console.error("Address validation error:", errorResponse.error);
          setMessage(
            "Error validating shipping address. Please try again later.",
          );
          return "Shipping address is not valid. Please check the details and try again.";
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return firstError ? firstError.message : "Invalid shipping address.";
        }
        return;
      }
    },
    [],
  );

  const handleAddressChange = useCallback(
    (event: StripeAddressElementChangeEvent) => {
      const value = event?.value ?? {};
      setShippingAddress({
        name: value?.name ?? "",
        address: {
          line1: value?.address?.line1 ?? "",
          line2: value?.address?.line2 ?? "",
          postal_code: value?.address?.postal_code ?? "",
          city: value?.address?.city ?? "",
          state: value?.address?.state ?? "",
        },
      });
      setIsShippingComplete(Boolean(event?.complete));
      if (message) setMessage("");
    },
    [message],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      // First, we check if the shipping address is complete. If it's not, we set an error message and stop the submission process.
      if (!isShippingComplete) {
        setMessage("Please complete your shipping address.");
        setIsSubmitting(false);
        return;
      }
      // Next, we validate the shipping address by calling our API route. If the API returns an error (e.g., the address is undeliverable), we display that message to the user and stop the submission process.
      const shippingValidationError =
        await validateShippingAddress(shippingAddress);
      if (shippingValidationError) {
        setMessage(shippingValidationError);
        setIsSubmitting(false);
        return;
      }
      // At this point, the shipping address is complete and has passed validation. We can proceed with confirming the payment.
      if (
        checkoutState.type !== "success" ||
        !checkoutState.checkout.canConfirm
      ) {
        setMessage("Checkout is not ready");
        setIsSubmitting(false);
        return;
      }
      // Confirm the payment. This will trigger Stripe's payment flow, which may include additional steps like 3D Secure authentication depending on the customer's card and bank.
      const confirmResult = await checkoutState.checkout.confirm();

      // This point will only be reached if there is an immediate error when
      // confirming the payment. Otherwise, your customer will be redirected to
      // your `return_url`. For some payment methods like iDEAL, your customer will
      // be redirected to an intermediate site first to authorize the payment, then
      // redirected to the `return_url`.
      if (confirmResult.type === "error") {
        setMessage(confirmResult.error.message);
      }

      setIsSubmitting(false);
    },
    [
      checkoutState,
      isShippingComplete,
      shippingAddress,
      validateShippingAddress,
    ],
  );

  // isValid drives the Pay button; async API validation runs only on submit.
  // Here we only check synchronous conditions to avoid calling async fn in render.
  const isValid =
    checkoutState.type === "success" &&
    checkoutState.checkout.canConfirm &&
    isShippingComplete;

  if (checkoutState.type === "loading") {
    return (
      <div className="flex justify-center">
        <h3>Loading Checkout Form</h3>
        <div>
          <CircularProgress
            size="20px"
            style={{
              display: "inline-flex",
              verticalAlign: "middle",
            }}
            color="inherit"
          />
        </div>
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return <div>Error: {checkoutState.error.message}</div>;
  }
  return (
    <div className="flex h-150 w-full flex-col rounded-lg bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <h2 className="font-header shrink-0 px-6 pt-6 pb-3 text-2xl font-bold text-white">
        Complete Your Purchase
      </h2>
      <form
        onSubmit={handleSubmit}
        className="checkout-scrollbar min-h-0 flex-1 overflow-y-scroll [scrollbar-gutter:stable] px-6 pb-6"
      >
        <TextInput
          label="Email"
          value={email}
          readOnly
          name="email"
          iconType="email"
        />
        <h3 className="font-header mt-5 text-sm uppercase tracking-[0.14em] text-yellow/90">
          Billing Address
        </h3>
        <BillingAddressElement />
        <h3 className="font-header mt-5 text-sm uppercase tracking-[0.14em] text-yellow/90">
          Shipping Address
        </h3>
        <ShippingAddressElement onChange={handleAddressChange} />
        <h3 className="font-header mt-5 text-sm uppercase tracking-[0.14em] text-yellow/90">
          Payment Method
        </h3>
        <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
        <BrandButton
          disabled={!isValid || isSubmitting}
          id="submit"
          type="submit"
          tone="ghost"
          variant="contained"
          className="mt-6 w-full"
        >
          {isSubmitting ? (
            <div className="spinner"></div>
          ) : (
            `Pay ${checkoutState.checkout.total.total.amount} now`
          )}
        </BrandButton>
        {/* Show any error or success messages */}
        {message && <div id="payment-message">{message}</div>}
      </form>
    </div>
  );
};

export default CheckoutForm;
