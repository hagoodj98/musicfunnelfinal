import { HttpError } from "./errorhandler";
import { updateMailchimpTag, updateMailchimpAddress } from "./mailchimpHelpers";
import {
  getSessionDataByToken,
  updateSessionData,
  setTimeToLive,
} from "./sessionHelpers";
import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
/////////////////////
export const handleCheckoutSessionExpired = async (
  paymentIntent: Stripe.Checkout.Session,
) => {
  if (!paymentIntent.metadata || !paymentIntent.metadata.sessionToken) {
    console.error("Missing sessionToken in checkout session metadata");
    throw new HttpError(
      'Missing sessionToken in checkout session metadata"',
      400,
    );
  }

  const sessionToken = paymentIntent.metadata.sessionToken;

  const sessionData = await getSessionDataByToken(sessionToken);
  if (sessionData && sessionData.checkoutStatus === "completed") {
    return new NextResponse(
      JSON.stringify({ message: "Session already completed." }),
      { status: 200 },
    );
  }
  if (sessionData.rememberMe === undefined) {
    throw new HttpError(
      "Session data is incomplete. Missing rememberMe property.",
      500,
    );
  }
  // Determine TTL based on rememberMe flag:
  const ttl = setTimeToLive(sessionData.rememberMe);

  // Update the checkoutStatus property on the retrieved session data
  sessionData.checkoutStatus = "cancelled";

  // Now call updateSessionData with the updated session object
  await updateSessionData(sessionToken, sessionData, ttl);
};
//////////////////////////
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
async function addressUpdateHandler(
  paymentIntent: Stripe.Checkout.Session,
  userEmail: string,
) {
  if (
    paymentIntent.shipping_details &&
    paymentIntent.shipping_details.address &&
    userEmail
  ) {
    const formattedAddress = {
      addr1: paymentIntent.shipping_details.address.line1,
      addr2: paymentIntent.shipping_details.address.line2 || "",
      city: paymentIntent.shipping_details.address.city,
      state: paymentIntent.shipping_details.address.state,
      zip: paymentIntent.shipping_details.address.postal_code,
      country: paymentIntent.shipping_details.address.country,
    };
    //This helper function gets the email, and the JSON object that mailchimp expects, not the email the user inserts in the form, but the email that is stored in the session data, which is the email that was used to subscribe to the mailing list. This way, we ensure that we are updating the correct subscriber's information in Mailchimp, even if the user entered a different email during checkout. The session data email should always reflect the subscriber's email in Mailchimp, allowing us to maintain accurate records and update the correct subscriber's address information.
    await updateMailchimpAddress(userEmail, formattedAddress);
    // After updating the address, we can also update the subscriber's tag to "Fan Purchaser" in Mailchimp
    await updateMailchimpTag(userEmail, "Fan Purchaser", "active");
  }
  return null;
}
