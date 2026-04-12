import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { checkEnvVariables } from "../../../../environmentVarAccess";
import { processSuccessfulCheckout } from "@/app/utils/checkoutHelpers";
import { HttpError } from "@/app/utils/errorhandler";

// This route is used as the endpoint for Stripe webhooks. It listens for events from Stripe, verifies the signature to ensure the request is legitimate, and then processes the event accordingly. For example, when a checkout session is completed, it can trigger fulfillment actions like updating a database or sending a confirmation email. The GET method is also implemented to allow for simple health checks of the webhook endpoint.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripeSecretKey = checkEnvVariables().stripeSecretKey;
  const stripe = new Stripe(stripeSecretKey);

  try {
    const buffer = await req.arrayBuffer();
    const rawBody = Buffer.from(buffer);

    const sig: string | null = req.headers.get("stripe-signature");
    const webhookSecret = checkEnvVariables().stripeWebhookSecret;
    // Verify the webhook
    let event;
    try {
      if (!sig) {
        throw new HttpError("Missing Stripe signature", 400);
      }
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      //est_aFaeVegwL3PuepTfzN3Je2b
    } catch (error) {
      // Signature verification failed
      console.error(
        "Stripe webhook signature verification failed:",
        (error as Error).message,
      );
      // 401 Unauthorized: The signature is invalid
      return NextResponse.json(
        { error: `Webhook Error: ${(error as Error).message}` },
        {
          status: 401,
        },
      );
    }
    switch (event.type) {
      case "checkout.session.completed":
        if (event.data.object.payment_status === "paid") {
          await processSuccessfulCheckout(event.data.object);
        }
        break;
      default:
        return NextResponse.json(
          { message: "Event type not handled" },
          { status: 200 },
        );
    }
    return NextResponse.json(
      { received: true },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(`Webhook Error: ${(error as Error).message}`, error);

    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: `Webhook Error: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}

/////////////////////////

export function GET() {
  return NextResponse.json(
    { message: "Stripe webhook endpoint is live" },
    { status: 200 },
  );
}
