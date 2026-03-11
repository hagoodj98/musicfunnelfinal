import {
  getPrelimSession,
  HttpError,
  setTimeToLive,
} from "../../../utils/sessionHelpers";
import redis from "../../../../lib/redis";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { UserSession } from "@/app/types/types";
export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); //parse text body that is coming in from mailchimp
    const params = new URLSearchParams(body);

    const type = params.get("type");
    const email = params.get("data[email]");

    if (type !== "subscribe" || !email) {
      console.error("Webhook Error: Invalid or missing data");
      throw new HttpError("Invalid or missing data", 400);
    }
    //returns object
    const userSessionToBeIssued: UserSession = await getPrelimSession(email);

    if (
      userSessionToBeIssued.rememberMe === undefined ||
      !userSessionToBeIssued
    ) {
      throw new HttpError(
        "Session data is incomplete. Missing possible session or rememberMe property.",
        500,
      );
    }
    const ttl = setTimeToLive(userSessionToBeIssued.rememberMe);
    if (!userSessionToBeIssued.secretToken) {
      throw new HttpError(
        "Session data is incomplete. Missing secret token.",
        500,
      );
    }
    const emailHash = crypto
      .createHmac("sha256", userSessionToBeIssued.secretToken)
      .update(userSessionToBeIssued.email)
      .digest("hex");
    // Update the session data with the new status
    const updatedUserSession: UserSession = {
      ...userSessionToBeIssued,
      status: "subscribed",
      ttl,
    };

    await redis.set(
      `sessionReadyForIssuance:${emailHash}`,
      JSON.stringify(updatedUserSession),
      "EX",
      ttl,
    );

    console.log(updatedUserSession, "updated");

    return new NextResponse(
      JSON.stringify({ status: "subscribed", details: updatedUserSession }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    if (error instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: error.status,
      });
    }
    return new NextResponse(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
      },
    );
  }
}

export function GET() {
  return new NextResponse("Webhook endpoint is live", { status: 200 });
}
