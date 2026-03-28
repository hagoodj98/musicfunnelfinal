import Stripe from "stripe";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getSessionDataByToken,
  updateSessionData,
  generateToken,
  createCookie,
} from "../../utils/sessionHelpers";
import { checkEnvVariables } from "../../../environmentVarAccess";
import type { UserSession } from "../../types/types";
import { HttpError } from "@/app/utils/errorhandler";
import { handleCheckoutSessionRateLimit } from "@/app/utils/limiterhelpers";
const stripe = new Stripe(checkEnvVariables().stripeSecretKey);
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
    // Check if the user has already completed checkout
    if (sessionData.checkoutStatus === "completed") {
      return new NextResponse(
        JSON.stringify({ message: "Checkout already completed." }),
        { status: 200 },
      );
    }
    // Implement rate limiting for checkout session creation to prevent abuse and brute-force attacks. This checks if the session token has exceeded the allowed number of attempts within a certain time frame. If the limit is exceeded, it will throw an error and prevent further processing of the checkout session creation.
    await handleCheckoutSessionRateLimit(sessionToken);

    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60; // Set session to expire in 30 minutes (in seconds)

    // Define the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: process.env.THANK_YOU_PAGE_URL as string,
      cancel_url: process.env.LANDING_PAGE_URL as string,
      billing_address_collection: "required", //Set to 'required' to collect billing address
      shipping_address_collection: {
        allowed_countries: ["US"], // Specify the countries to which I am willing to ship
      },
      expires_at: expiresAt, //When I want this session to expire automatically
      metadata: {
        sessionToken: sessionToken,
      },
    });

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

    return new NextResponse(JSON.stringify({ id: session.id }), {
      status: 200,
    });
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
