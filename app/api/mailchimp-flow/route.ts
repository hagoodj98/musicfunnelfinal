import { NextRequest, NextResponse } from "next/server";
import { createCookie, generateToken } from "../../utils/sessionHelpers";
import { UserSession } from "../../types/types";
import crypto from "crypto";
import redis from "@/lib/redis";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "debug@local.test").toLowerCase();
  const name = searchParams.get("name") || "Debug User";
  const rememberMe = searchParams.get("rememberMe") !== "false";

  const ttl = rememberMe ? 80 : 90;

  const { secretSaltToken } = generateToken();
  const emailHash = crypto
    .createHmac("sha256", secretSaltToken ?? "20")
    .update(email)
    .digest("hex");
  await createCookie("pendingSubscription", emailHash, {
    maxAge: ttl,
    sameSite: "lax",
  });
  const sessionData: UserSession = {
    email,
    name,
    status: "subscribed",
    rememberMe,
    ttl,
    secretToken: secretSaltToken,
  };

  await redis.set(
    `sessionReadyForIssuance:${emailHash}`,
    JSON.stringify(sessionData),
    "EX",
    ttl,
  );

  return NextResponse.redirect(
    new URL("/api/email-confirmation", req.url),
    302,
  );
}
