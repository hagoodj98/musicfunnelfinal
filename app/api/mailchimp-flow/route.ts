import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "../../utils/sessionHelpers";
import { UserSession } from "../../types/types";
import crypto from "crypto";
import redis from "@/lib/redis";
import { HttpError } from "@/app/utils/errorhandler";
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (
      searchParams.get("email") || "debug@local.test"
    ).toLowerCase();
    const name = searchParams.get("name") || "Debug User";
    const rememberMe = searchParams.get("rememberMe") !== "false";

    const ttl = rememberMe ? 86400 : 86400;

    const { secretSaltToken } = generateToken();
    const emailHash = crypto
      .createHmac("sha256", secretSaltToken ?? "20")
      .update(email)
      .digest("hex");
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

    const redirectResponse = NextResponse.redirect(
      new URL("/confirming-email", process.env.NEXT_PUBLIC_BASE_URL),
      302,
    );
    const isSecure =
      new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000")
        .protocol === "https:";
    redirectResponse.cookies.set("pendingSubscription", emailHash, {
      httpOnly: true,
      secure: isSecure,
      path: "/",
      maxAge: ttl,
      sameSite: "lax",
    });
    return redirectResponse;
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
