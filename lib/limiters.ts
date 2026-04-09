import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "./redis";

// Rate limiter for session token creation to prevent abuse and brute-force attacks. This limits the number of attempts to create a session token within a certain time frame. If the limit is exceeded, it will block further attempts for a specified duration.
const checkoutSessionRateLimiter = () => {
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "checkoutSessionRateLimiter", // Prefix for Redis keys to avoid collisions
    points: 3, // Allow 3 attempts per session token
    duration: 600, // Per 10 minutes
  });
};

const findEmailRateLimiter = () => {
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "findEmailRateLimiter",
    points: 1, // Allow 1 attempt
    duration: 86400, // Per 24 hours (86400 seconds) - this means you can only check the same email once per day, which helps prevent abuse and brute-force attacks on email lookups.
    // Short in-memory block to drop bursts before more Redis roundtrips.
    inMemoryBlockOnConsumed: 1, // If 1 point is consumed, block in memory to prevent further attempts without hitting Redis.
    inMemoryBlockDuration: 60, // Block in memory for 60 seconds
  });
};

const subscriberEmailRateLimiter = (ttl: number) => {
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "subscriberEmailRateLimiter",
    points: 1, // Allow 1 attempt
    duration: ttl, // trying to subscribe with the same email more than once within the TTL will trigger the block
    // Short in-memory block to drop bursts before more Redis roundtrips.
    inMemoryBlockOnConsumed: 1, // If 1 point is consumed, block in memory to prevent further attempts without hitting Redis.
    inMemoryBlockDuration: ttl, // Block in memory for the duration of the TTL
  });
};
const validateAddressRateLimiter = () => {
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "validateAddressRateLimiter",
    points: 2, // Allow 2 attempts per session token
    duration: 3600, // Per hour
    inMemoryBlockOnConsumed: 2, // If 2 points are consumed, block in memory to prevent further attempts without hitting Redis.
    inMemoryBlockDuration: 3600, // Block in memory for 1 hour to prevent further attempts after the first failure, which adds an extra layer of protection against abuse while still allowing legitimate users to try again after the TTL expires.
  });
};
export {
  checkoutSessionRateLimiter,
  findEmailRateLimiter,
  subscriberEmailRateLimiter,
  validateAddressRateLimiter,
};
