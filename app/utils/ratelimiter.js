import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "./redis";


// Configure the rate limiter for global or IP-based limiting.
// Here we limit to 10 requests per minute per IP. Adjust as needed.
//We create a function that keeps track of how many times an IP has called our API using Redis. Every time someone calls the API from a given IP, we add one point to a counter for that IP.
export const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rlflx',
    points: 10, // 10 requests
    duration: 60, // per 60 seconds
  });