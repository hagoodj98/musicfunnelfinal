import Stripe from "stripe";
import { NextResponse } from "next/server";
import { checkEnvVariables } from "../../../environmentVarAccess";
import { HttpError } from "@/app/utils/errorhandler";
import { getSessionDataByToken } from "@/app/utils/sessionHelpers";
import { cookies } from "next/headers";
const stripe = new Stripe(checkEnvVariables().stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});
const priceId = checkEnvVariables().stripePriceId;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value; //my session sticker/cookie tells the server who the user is.
    const csrfToken = cookieStore.get("csrfToken")?.value; //Another secret sticker/cookie that helps protect against attacks.

    if (!sessionToken) {
      throw new HttpError("Session token is required", 401);
    }
    if (!csrfToken) {
      throw new HttpError("CSRF token is required", 401);
    }

    const sessionData = await getSessionDataByToken(sessionToken); //now sessionData is a parsed JSON Object
    if (!sessionData)
      throw new HttpError("Session not found. Unauthorized access", 404);
    if (sessionData.rememberMe === undefined) {
      throw new HttpError(
        "Session data is incomplete. Missing rememberMe property.",
        500,
      );
    }
    // The CSRF token from the cookie must match the one stored in the session data to ensure the request is legitimate and not forged. If they don't match, we reject the request with a 403 Forbidden error, indicating that the CSRF validation failed and the request is unauthorized.
    if (csrfToken !== sessionData.csrfToken) {
      throw new HttpError("Invalid CSRF token. Unauthorized!", 403);
    }

    // Define the checkout session
    const session = await stripe.checkout.sessions.create({
      ui_mode: "elements", // Use Stripe-hosted UI for payment collection
      customer_email: sessionData.email, // Pre-fill the customer's email in the checkout form
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      automatic_tax: { enabled: true },
      return_url: `${process.env.THANK_YOU_PAGE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`, // Redirect to this URL after successful payment. The {CHECKOUT_SESSION_ID} placeholder will be replaced with the actual session ID by Stripe.
    });
    /*
    const newCsrfToken = generateToken().csrfToken;

    const updatedSessionData: UserSession = {
      ...sessionData,
      stripeSessionId: session.id,
      checkoutStatus: "initiated",
      csrfToken: newCsrfToken,
    };

    await updateSessionData(
      sessionToken,
      updatedSessionData,
      expiresAt - Math.floor(Date.now() / 1000),
    ); // Set TTL to match Stripe session expiration

    createCookie("sessionToken", sessionToken, {
      maxAge: expiresAt - Math.floor(Date.now() / 1000),
      sameSite: "lax",
    });

    createCookie("csrfToken", newCsrfToken, {
      maxAge: expiresAt - Math.floor(Date.now() / 1000),
      sameSite: "lax",
    });
*/
    return new NextResponse(
      JSON.stringify({
        clientSecret: session.client_secret,
        customerEmail: sessionData.email,
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    if (error instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: error.status,
      });
    }
    return new NextResponse(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 },
    );
  }
}
