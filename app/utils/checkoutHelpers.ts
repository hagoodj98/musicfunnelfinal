import { HttpError } from "./errorhandler";
import { updateMailchimpTag, updateMailchimpAddress } from "./mailchimpHelpers";
import {
  getSessionDataByToken,
  updateSessionData,
  setTimeToLive,
} from "./sessionHelpers";
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
export const handleCheckoutSessionCompleted = async (
  paymentIntent: Stripe.Checkout.Session,
) => {
  if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
    console.error(
      "No sessionToken in payment metadata - possibly Payment Link purchase. Skipping session-based logic.",
    );
    throw new HttpError('Missing sessionToken in payment metadata"', 400);
  }
  const sessionToken = paymentIntent.metadata.sessionToken;
  // Retrieve current session data (using your helper)
  const sessionData = await getSessionDataByToken(sessionToken);

  sessionData.checkoutStatus = "completed";
  if (sessionData.rememberMe === undefined) {
    throw new HttpError(
      "Session data is incomplete. Missing rememberMe property.",
      500,
    );
  }
  const ttl = setTimeToLive(sessionData.rememberMe);
  await updateSessionData(sessionToken, sessionData, ttl);
  await addressUpdateHandler(paymentIntent, sessionData.email);
};
// The addressUpdateHandler function is responsible for updating the subscriber's address information in Mailchimp based on the shipping details collected during the Stripe checkout process. It takes the payment intent and the user's email as parameters, formats the address data according to Mailchimp's requirements, and then calls the helper functions to update both the address and the subscriber's tag in Mailchimp.
async function addressUpdateHandler(
  paymentIntent: Stripe.Checkout.Session,
  userEmail: string,
) {
  if (
    paymentIntent.collected_information?.shipping_details &&
    paymentIntent.collected_information.shipping_details.address &&
    userEmail
  ) {
    const formattedAddress = {
      addr1: paymentIntent.collected_information.shipping_details.address.line1,
      addr2:
        paymentIntent.collected_information.shipping_details.address.line2 ||
        "",
      city: paymentIntent.collected_information.shipping_details.address.city,
      state: paymentIntent.collected_information.shipping_details.address.state,
      zip: paymentIntent.collected_information.shipping_details.address
        .postal_code,
      country:
        paymentIntent.collected_information.shipping_details.address.country,
    };
    //This helper function gets the email, and the JSON object that mailchimp expects, not the email the user inserts in the form, but the email that is stored in the session data, which is the email that was used to subscribe to the mailing list. This way, we ensure that we are updating the correct subscriber's information in Mailchimp, even if the user entered a different email during checkout. The session data email should always reflect the subscriber's email in Mailchimp, allowing us to maintain accurate records and update the correct subscriber's address information.
    await updateMailchimpAddress(userEmail, formattedAddress);
    // After updating the address, we can also update the subscriber's tag to "Fan Purchaser" in Mailchimp
    await updateMailchimpTag(userEmail, "Fan Purchaser", "active");
  }
  return null;
}
