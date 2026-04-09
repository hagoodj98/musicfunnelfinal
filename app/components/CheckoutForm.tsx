import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [isAddressError, setIsAddressError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checkoutState = useCheckout() as StripeUseCheckoutResult;
  const router = useRouter();
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
  // We track whether the shipping address is complete using Stripe's onChange event from the ShippingAddressElement. This allows us to enable or disable the Pay button based on whether the user has completed their shipping address, which is a required step before they can proceed with payment.
  const [isShippingComplete, setIsShippingComplete] = useState(false);
  // We run the user-provided shipping address through our validation API route, which checks if the address is deliverable using Smarty's API and also applies rate limiting to prevent abuse. If the address is undeliverable, we return that message to the user. If there are too many attempts, we inform the user that their session has been closed and redirect them to the home page where they can start a new session if they want to try again.
  const validateShippingAddress = useCallback(
    async (shippingAddress: ShippingAddressState) => {
      try {
        // We first validate the shipping address input using our Zod schema to ensure it has the correct structure before sending it to the API route. This helps catch any client-side errors early and provides immediate feedback to the user if their input is malformed.
        const userAddress = isValidAddressSchema.parse({
          line1: shippingAddress.address.line1,
          line2: shippingAddress.address.line2,
          city: shippingAddress.address.city,
          state: shippingAddress.address.state,
          postal_code: shippingAddress.address.postal_code,
        });
        // Next, we call our API route to validate the shipping address. We send the address data as JSON in the request body. The API route will check if the address is deliverable and also enforce rate limits to prevent abuse. If the API returns an error (e.g., the address is undeliverable or there are too many attempts), we handle those cases accordingly by displaying messages to the user and potentially redirecting them if their session is closed due to too many attempts.
        const response = await fetch("/api/validate-shipping-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userAddress),
        });

        if (!response.ok) {
          const data = await response.json();

          // If the error is related to too many attempts, we inform the user that their session has been closed and redirect them to the home page after a short delay, where they can start a new session if they want to try again.
          if (response.status === 429) {
            // Session and cookies were deleted server-side
            // notify user using the snackbar and redirect to home page where they can start a new session if they want to try again.
            return "Too many attempts for validating address. Your session has been closed. Redirecting to home page...";
          }
          // If the error is related to the address being undeliverable, we set an address error state to true and return a specific message to inform the user that their shipping address is undeliverable. This allows us to provide clear feedback to the user about the issue with their address input.
          if (response.status === 422) {
            setIsAddressError(true);
            return `Shipping address is undeliverable. You have 1 attempt remaining before your session is closed.`;
          }
          // If the error is related to missing session token, we return a specific message to inform the user that they need to have an active session to validate their address. This can happen if their session has expired or if they are trying to access the validation endpoint without going through the proper flow of the checkout process.
          if (response.status === 401) {
            return "Can't validate address because session data is missing.";
          }
          throw new Error(data.error || "Error validating shipping address");
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return firstError ? firstError.message : "Invalid shipping address.";
        }
        return "Unexpected error validating address. Please try again.";
      }
    },
    [],
  );

  const handleAddressChange = useCallback(
    (event: StripeAddressElementChangeEvent) => {
      // We update the shipping address state whenever there is a change in the ShippingAddressElement. This allows us to keep track of the user's input in real-time and also determine whether the shipping address is complete, which is necessary for enabling the Pay button and allowing the user to proceed with payment. We also reset any messages when the user makes changes to the address, so that they can get fresh feedback based on their latest input.
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
      // We determine if the shipping address is complete based on Stripe's event, which provides a `complete` property that indicates whether all required fields in the shipping address have been filled out. This allows us to enable the Pay button only when the user has completed their shipping address, ensuring that they cannot proceed with payment until this necessary information is provided.
      setIsShippingComplete(Boolean(event?.complete)); //
      setMessage(""); // React bails out if value is unchanged, so no dep on `message` needed
    },
    [],
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
      // If there was an error during shipping address validation, we display the error message to the user. If the error indicates that there were too many attempts, we also inform the user that their session has been closed and redirect them to the home page after a short delay. If the error is something else, we simply display the error message and allow the user to try again.
      if (shippingValidationError) {
        // If the error message includes "Too many attempts", it means the user's session has been closed due to exceeding the rate limit for address validation attempts. In this case, we inform the user of the situation and redirect them to the home page after a short delay, where they can start a new session if they want to try again.
        if (shippingValidationError.includes("Too many attempts")) {
          setIsSubmitting(false); // Stop the submission process before redirecting
          setMessage(shippingValidationError); // Inform the user about the session closure
          setTimeout(() => {
            router.push("/"); // Redirect to home page after 3 seconds
          }, 3000);
        }
        // If the error message includes "Can't validate address because session data is missing", it means the user's session is missing necessary data for address validation, which could happen if their session has expired or if they are trying to access the validation endpoint without going through the proper flow. In this case, we inform the user about the missing session data and redirect them to the home page after a short delay, where they can start a new session if they want to try again.
        if (shippingValidationError.includes("missing")) {
          setIsSubmitting(false); // Stop the submission process before redirecting
          setMessage(shippingValidationError); // Inform the user about the missing session token
          setTimeout(() => {
            router.push("/"); // Redirect to home page after 3 seconds
          }, 3000);
        }
        setMessage(shippingValidationError); // Display the error message to the user (e.g., undeliverable address or validation error)
        setIsSubmitting(false);
        return;
      }
      // At this point, the shipping address is complete and has passed validation. We can proceed with confirming the payment.
      if (
        checkoutState.type !== "success" ||
        !checkoutState.checkout.canConfirm
      ) {
        // We also check if the checkout state is successful and if we can confirm the payment. If not, we set an error message and stop the submission process.
        setMessage("Checkout is not ready");
        setIsSubmitting(false);
        return;
      }
      // Confirm the payment. This will trigger Stripe's payment flow, which may include additional steps like 3D Secure authentication depending on the customer's card and bank.
      const confirmResult = await checkoutState.checkout.confirm(); // After confirming the payment, we check the result. If there is an error (e.g., card declined, authentication failed), we display the error message to the user. If the payment is successful, the customer will be redirected to the return URL specified in our checkout session configuration, so we don't need to handle that redirection here.

      // This point will only be reached if there is an immediate error when
      // confirming the payment. Otherwise, your customer will be redirected to
      // your `return_url`. For some payment methods like iDEAL, your customer will
      // be redirected to an intermediate site first to authorize the payment, then
      // redirected to the `return_url`. We dont need to listen for payment fails in webhooks because if the payment fails, the user will be redirected to the return_url with a failed status in the query params. Then in the ThankYou page, I can check for that failed status and display a message to the user accordingly.
      if (confirmResult.type === "error") {
        setMessage(confirmResult.error.message);
      }
      setIsSubmitting(false); // Reset the submitting state after handling the payment confirmation result
    },
    [
      checkoutState,
      router,
      isShippingComplete,
      shippingAddress,
      validateShippingAddress,
    ], // We include all dependencies that are used within the handleSubmit function to ensure that it has access to the latest values and functions when it is called. This includes the checkout state, router for navigation, shipping address state, and the validateShippingAddress function.
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
        {message && (
          <div
            id="payment-message"
            className={`mt-4 rounded-md border px-4 py-3 text-sm ${
              isAddressError
                ? "border-red-400/40 bg-red-500/20 text-red-200"
                : "border-white/20 bg-white/10 text-white"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default CheckoutForm;
