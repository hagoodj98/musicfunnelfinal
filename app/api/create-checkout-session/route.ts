import Stripe from "stripe";
import { NextResponse } from "next/server";
import { checkEnvVariables } from "../../../environmentVarAccess";
import { HttpError } from "@/app/utils/errorhandler";
import { getSessionDataByToken } from "@/app/utils/sessionHelpers";
import { cookies } from "next/headers";
import redis from "@/lib/redis";

export async function POST() {
  try {
    const { stripeSecretKey, stripePriceId: priceId } = checkEnvVariables();
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-03-25.dahlia",
    });
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    const csrfToken = cookieStore.get("csrfToken")?.value;

    if (!sessionToken || !csrfToken) {
      await redis.del(`session:${sessionToken}`);
      cookieStore.delete("sessionToken");
      cookieStore.delete("csrfToken");
      throw new HttpError("Session or CSRF token is missing", 401);
    }
    const sessionData = await getSessionDataByToken(sessionToken);
    if (!sessionData) {
      throw new HttpError("Session not found. Unauthorized access", 404);
    }
    if (sessionData.rememberMe === undefined) {
      throw new HttpError(
        "Session data is incomplete. Missing rememberMe property.",
        500,
      );
    }
    if (sessionData.checkoutStatus === "completed") {
      throw new HttpError("Purchase already completed.", 403);
    }
    if (csrfToken !== sessionData.csrfToken) {
      throw new HttpError("Unauthorized.", 403);
    }
    const session = await stripe.checkout.sessions.create({
      ui_mode: "elements",
      customer_email: sessionData.email,
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
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/landing/thankyou`,
      metadata: {
        sessionToken: sessionToken,
      },
    });
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
    console.error("[API] Error creating Stripe checkout session:", error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Error creating Stripe checkout session" },
      { status: 500 },
    );
  }
}
