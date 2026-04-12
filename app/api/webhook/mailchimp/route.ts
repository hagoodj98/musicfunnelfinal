import { getPrelimSession, setTimeToLive } from "../../../utils/sessionHelpers";
import redis from "../../../../lib/redis";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { UserSession } from "@/app/types/types";
import { HttpError } from "@/app/utils/errorhandler";

function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function isExpectedUserAgent(userAgent: string): boolean {
  // Mailchimp's user agent typically includes "Mailchimp" or "Mailchimp Webhooks". This check is a simple way to add an additional layer of verification to ensure that the request is coming from Mailchimp. However, it's important to note that user agent strings can be spoofed, so this should not be the sole method of verification. It should be used in conjunction with other security measures, such as validating a secret token, to ensure the authenticity of the webhook request.
  return /mailchimp/i.test(userAgent);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let emailHash: string;
const expectedWebhookToken = process.env.MAILCHIMP_WEBHOOK_TOKEN as string;
export async function POST(req: NextRequest) {
  try {
    if (!expectedWebhookToken) {
      throw new HttpError("MAILCHIMP_WEBHOOK_TOKEN is not configured", 500);
    }
    // Validate the incoming webhook request to ensure it is from Mailchimp and has the correct format. This includes checking for a specific token in the query parameters, verifying the content type of the request, and validating the user agent string to confirm that the request is coming from Mailchimp. If any of these checks fail, we reject the request with an appropriate error message and status code.
    const incomingWebhookToken = req.nextUrl.searchParams.get("token");
    if (
      !incomingWebhookToken ||
      !safeCompare(incomingWebhookToken, expectedWebhookToken)
    ) {
      throw new HttpError("Unauthorized webhook request", 401);
    }
    //  Validate the content type of the incoming webhook request to ensure it is in the expected format. Mailchimp typically sends webhook data as "application/x-www-form-urlencoded". If the content type does not match this expected format, we reject the request with a 415 Unsupported Media Type error, indicating that the payload format is not supported.
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      throw new HttpError("Unsupported webhook payload format", 415);
    }
    // Validate the user agent string of the incoming webhook request to confirm that it is coming from Mailchimp. This is an additional security measure to help prevent unauthorized sources from sending requests to this endpoint. If the user agent does not match the expected pattern for Mailchimp, we reject the request with a 401 Unauthorized error, indicating that the source of the webhook is not authorized.
    const userAgent = req.headers.get("user-agent") || "";
    if (!isExpectedUserAgent(userAgent)) {
      throw new HttpError("Unauthorized webhook source", 401);
    }

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
    const oldEmailHash = crypto
      .createHmac("sha256", userSessionToBeIssued.secretToken)
      .update(userSessionToBeIssued.email)
      .digest("hex");
    emailHash = oldEmailHash;

    // Update the session data with the new status
    const updatedUserSession: UserSession = {
      ...userSessionToBeIssued,
      status: "subscribed",
      ttl,
    };

    //Instead of polling, and being concerned about state resetting on the client. At the point the user confirms email, issue all cookies and session here and do a permanent redirect.
    await redis
      .multi()
      .set(
        `sessionReadyForIssuance:${oldEmailHash}`,
        JSON.stringify(updatedUserSession),
        "EX",
        ttl,
      )
      .del(`emailReference:${userSessionToBeIssued.email}`)
      .del(`prelimSession:${oldEmailHash}`)
      .exec();

    return NextResponse.json({ message: "user subscribed!" }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: (error as Error).message },
      {
        status: 500,
      },
    );
  }
}

export function GET() {
  return new NextResponse("Webhook endpoint is live", { status: 200 });
}
