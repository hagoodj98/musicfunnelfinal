import { NextRequest } from "next/server";
import { HttpError } from "./errorhandler";
import {
  checkoutSessionRateLimiter,
  findEmailRateLimiter,
  subscriberEmailRateLimiter,
} from "@/lib/limiters";
import crypto from "crypto";

export const handleCheckoutSessionRateLimit = async (sessionToken: string) => {
  try {
    await checkoutSessionRateLimiter().consume(sessionToken);
  } catch (rateLimitError: unknown) {
    handleRateLimitError(rateLimitError, `session token ${sessionToken}`);
  }
};
export const handleFindEmailRateLimit = async (email: string) => {
  try {
    await findEmailRateLimiter().consume(email);
  } catch (rateLimitError: unknown) {
    handleRateLimitError(rateLimitError, `email: ${email}`);
  }
};
export const handleSubscribeRateLimit = async (email: string, ttl: number) => {
  try {
    await subscriberEmailRateLimiter(ttl).consume(email);
  } catch (rateLimitError: unknown) {
    handleRateLimitError(rateLimitError, `subscription for email: ${email}`);
  }
};

function handleRateLimitError(rateLimitError: unknown, context: string): never {
  const retryAfterSeconds =
    typeof rateLimitError === "object" &&
    rateLimitError !== null &&
    "msBeforeNext" in rateLimitError
      ? Math.ceil(Number(rateLimitError.msBeforeNext) / 1000)
      : 60;

  throw new HttpError(
    `Too many attempts for ${context}. Try again in ${retryAfterSeconds} seconds.`,
    429,
  );
}

export const getClientIp = (req: NextRequest): string => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  //Every time traffic passes through another proxy, that proxy appends its own address to the far right.
  //So we always grab the first value to get the real client.
  const ipFromForwardedHeader = forwardedFor?.split(",")[0]?.trim();
  const ipAddress = ipFromForwardedHeader || realIp || "unknown-ip";
  const ipAddressWithHash = crypto
    .createHash("sha256")
    .update(ipAddress + process.env.IP_HASH_SALT) // Combine IP with a server-side salt for added security
    .digest("hex");
  return ipAddressWithHash;
};
