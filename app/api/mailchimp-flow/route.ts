import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "../../utils/sessionHelpers";
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
  const preliminarysessionData: UserSession = {
    email,
    name,
    status: "pending",
    rememberMe,
    secretToken: secretSaltToken,
  };

  await redis
    .multi()
    .set(
      `prelimSession:${emailHash}`,
      JSON.stringify(preliminarysessionData),
      "EX",
      ttl,
    )
    .set(`emailReference:${email.toLowerCase()}`, emailHash, "EX", ttl)
    .exec();
  try {
    const response = await fetch(
      `${req.nextUrl.origin}/api/webhook/mailchimp?token=${process.env.MAILCHIMP_WEBHOOK_SECRET}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "mailchimp",
        },
        body: `type=subscribe&data[email]=${email}`,
      },
    );
    const setCookies = response.headers.getSetCookie?.() ?? [];

    const res = NextResponse.redirect(new URL("/landing", req.url), 302);
    for (const c of setCookies) {
      res.headers.append("Set-Cookie", c);
    }

    return res;
  } catch (error: unknown) {
    console.log(error);
  }
}
