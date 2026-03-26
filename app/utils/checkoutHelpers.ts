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

  if (
    paymentIntent.shipping_details &&
    paymentIntent.shipping_details.address &&
    sessionData.email
  ) {
    const formattedAddress = {
      addr1: paymentIntent.shipping_details.address.line1,
      addr2: paymentIntent.shipping_details.address.line2 || "",
      city: paymentIntent.shipping_details.address.city,
      state: paymentIntent.shipping_details.address.state,
      zip: paymentIntent.shipping_details.address.postal_code,
      country: paymentIntent.shipping_details.address.country,
    };
    //This helper function gets the email, and the JSON object that mailchimp expects
    await updateMailchimpAddress(sessionData.email, formattedAddress);
  }
  // /NEW: Update the subscriber's tag to "Fan Purchaser" *****
  if (sessionData.email) {
    await updateMailchimpTag(sessionData.email, "Fan Purchaser", "active");
  }
};
