import { HttpError } from "./errorhandler";
import {
  findEmailRateLimiter,
  checkoutSessionRateLimiter,
  subscriberEmailRateLimiter,
} from "@/lib/limiters";

export const handleCheckoutSessionRateLimit = async (sessionToken: string) => {
  try {
    await checkoutSessionRateLimiter.consume(sessionToken);
  } catch (rateLimitError: unknown) {
    handleRateLimitError(rateLimitError, `checkout session ${sessionToken}`);
  }
};
export const handleFindEmailRateLimit = async (email: string) => {
  try {
    await findEmailRateLimiter.consume(email);
  } catch (rateLimitError: unknown) {
    handleRateLimitError(rateLimitError, `email: ${email}`);
  }
};
export const handleSubscribeRateLimit = async (email: string) => {
  try {
    await subscriberEmailRateLimiter.consume(email);
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
