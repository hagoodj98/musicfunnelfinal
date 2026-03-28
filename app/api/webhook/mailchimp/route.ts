import { getPrelimSession, setTimeToLive } from "../../../utils/sessionHelpers";
import redis from "../../../../lib/redis";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getClientIp } from "@/app/utils/limiterhelpers";
import { UserSession } from "@/app/types/types";
import { HttpError } from "@/app/utils/errorhandler";
function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function isAllowedWebhookIp(ip: string): boolean {
  const allowedIps = (process.env.MAILCHIMP_WEBHOOK_ALLOWED_IPS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (allowedIps.includes(ip)) {
    return true;
  }

  const allowedIpHashes = (
    process.env.MAILCHIMP_WEBHOOK_ALLOWED_IP_HASHES || ""
  )
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (allowedIpHashes.length > 0) {
    const salt = process.env.IP_HASH_SALT;
    if (!salt) {
      return false;
    }

    const requestIpHash = crypto
      .createHash("sha256")
      .update(ip + salt)
      .digest("hex");

    return allowedIpHashes.some((hash) => safeCompare(hash, requestIpHash));
  }

  // If no allowlist is configured, skip IP allowlist enforcement.
  return allowedIps.length === 0;
}

function isExpectedUserAgent(userAgent: string): boolean {
  return /mailchimp/i.test(userAgent);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let emailHash: string;
export async function POST(req: NextRequest) {
  try {
    const expectedWebhookToken =
      process.env.MAILCHIMP_WEBHOOK_TOKEN ||
      process.env.MAILCHIMP_WEBHOOK_SECRET;
    if (!expectedWebhookToken) {
      throw new HttpError("MAILCHIMP_WEBHOOK_TOKEN is not configured", 500);
    }

    const incomingWebhookToken = req.nextUrl.searchParams.get("token");
    if (
      !incomingWebhookToken ||
      !safeCompare(incomingWebhookToken, expectedWebhookToken)
    ) {
      throw new HttpError("Unauthorized webhook request", 401);
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      throw new HttpError("Unsupported webhook payload format", 415);
    }

    const userAgent = req.headers.get("user-agent") || "";
    if (!isExpectedUserAgent(userAgent)) {
      throw new HttpError("Unauthorized webhook source", 401);
    }

    const requestIp = getClientIp(req);
    if (!isAllowedWebhookIp(requestIp)) {
      throw new HttpError("Webhook IP is not allowlisted", 401);
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

    return new NextResponse(JSON.stringify({ message: "user subscribed!" }), {
      status: 200,
    });
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
