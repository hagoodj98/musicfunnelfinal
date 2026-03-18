import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { HttpError } from "../../../utils/sessionHelpers";
import { checkEnvVariables } from "../../../../environmentVarAccess";
import {
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired,
} from "@/app/utils/checkoutHelpers";
export const config = {
  api: {
    bodyParser: false,
  },
};
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
    } catch (error) {
      // Signature verification failed
      console.error(
        "Stripe webhook signature verification failed:",
        (error as Error).message,
      );
      // 401 Unauthorized: The signature is invalid
      return new NextResponse(`Webhook Error: ${(error as Error).message}`, {
        status: 401,
      });
    }
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
        return new NextResponse(
          JSON.stringify({ message: "Event type not handled" }),
          { status: 200 },
        );
    }
    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error(`Webhook Error: ${(error as Error).message}`, error);

    if (error instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: error.status,
      });
    }
    return new NextResponse(`Webhook Error: ${(error as Error).message}`, {
      status: 500,
    });
  }
}

/////////////////////////

export function GET() {
  return new NextResponse("Stripe webhook endpoint is live", { status: 200 });
}
