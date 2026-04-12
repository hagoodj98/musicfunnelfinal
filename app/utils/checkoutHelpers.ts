import { HttpError } from "./errorhandler";
import { updateCheckoutSessionData } from "./sessionHelpers";
import type { Stripe } from "stripe";

//////////////////////////
// This file contains helper functions related to the checkout process, including handling the completion of a checkout session and updating Mailchimp subscriber information based on the checkout outcome. These functions are used in the Stripe webhook route to process events after a user completes the checkout process.
//////////////////////////

/**
 * Handles the completion of a Stripe checkout session. This function is triggered when a checkout session is completed, and it performs several important tasks:
 * 1. It checks for the presence of a session token in the payment metadata to identify the user's session.
 * 2. It retrieves the current session data using the session token and updates the checkout status to "completed".
 * 3. It calculates the appropriate time-to-live (TTL) for the session data based on whether the user chose to be remembered or not.
 * 4. It updates the session data in the database with the new checkout status and TTL.
 * 5. It calls a helper function to update the user's address information in Mailchimp based on the shipping details collected during checkout, and also updates their tag to "Fan Purchaser".
 *
 * @param {Stripe.Checkout.Session} paymentIntent - The Stripe checkout session object that contains information about the completed checkout.
 */
export const processSuccessfulCheckout = async (
  paymentIntent: Stripe.Checkout.Session,
) => {
  if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
    console.error(
      "No sessionToken in payment metadata - possibly Payment Link purchase. Skipping session-based logic.",
    );
    throw new HttpError('Missing sessionToken in payment metadata"', 400);
  }
  const sessionToken = paymentIntent.metadata.sessionToken;
  // Update session data to mark checkout as completed and set appropriate TTL based on rememberMe status
  await updateCheckoutSessionData(sessionToken, paymentIntent);
};
