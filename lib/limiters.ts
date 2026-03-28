import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "./redis";

// Rate limiter for checkout session creation to prevent abuse and brute-force attacks. This limits the number of attempts to create a checkout session within a certain time frame. If the limit is exceeded, it will block further attempts for a specified duration.

const checkoutSessionRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "checkoutSessionRateLimiter", // Prefix for Redis keys to avoid collisions
  // points: max attempts allowed inside duration window.
  // In this case, we allow 3 attempts to create a checkout session within a 10-minute window. If the limit is exceeded, the user will be blocked from creating new sessions for 30 minutes.
  points: 3,
  // duration: rolling window length in seconds.
  duration: 600,
  // blockDuration: full lockout time after points are exhausted.
  blockDuration: 1800, // 1 hour block after 3 attempts
  // Short in-memory block to drop bursts before more Redis roundtrips.
  inMemoryBlockOnConsumed: 3, // If 3 points are consumed, block in memory to prevent further attempts without hitting Redis.
  inMemoryBlockDuration: 60,
});
const findEmailRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "findEmailRateLimiter",
  points: 1, // Allow 1 attempt
  duration: 86400, // Per 24 hours
});
const subscriberEmailRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "subscriberEmailRateLimiter",
  points: 1, // Allow 1 attempt
  duration: 86400, // trying to subscribe with the same email more than once within 24 hours will trigger the block
});

export {
  checkoutSessionRateLimiter,
  findEmailRateLimiter,
  subscriberEmailRateLimiter,
};
