import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "./redis";

//IP gets three attempts

const ipRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "checkSubscriberIp",

  // points: max attempts allowed inside duration window.
  //User may make typos, so we allow 3 chances
  points: 8,
  // duration: rolling window length in seconds.
  duration: 600,
  // blockDuration: full lockout time after points are exhausted.
  blockDuration: 1800, // 1 hour block after 3 attempts
  // Short in-memory block to drop bursts before more Redis roundtrips.
  inMemoryBlockOnConsumed: 8,
  inMemoryBlockDuration: 60,
});

export default ipRateLimiter;
