import redis from './redis';
import { HttpError } from './sessionHelpers';

/**
 * Checks a rate limit for a given key.
 * 
 * This function increments the counter stored in Redis for the provided key.
 * - If this is the first call (attempts === 1), it sets an initial expiration (expireSeconds).
 * - Optionally, if you want a sliding window, it can refresh the TTL on every call (if attempts <= limit).
 * - If the number of attempts exceeds the limit, it sets a lockout TTL (lockoutSeconds) if needed,
 *   and throws an HttpError with status 429.
 *
 * @param {string} key - The Redis key to track (e.g., `emailLimit:user@example.com`). The function uses a Redis key (e.g., "emailLimit:user@example.com" or "findMeLimit:someEmail") to track how many times an action has been attempted.
 * @param {number} limit - The maximum number of allowed attempts within the expiration window.
 * @param {number} expireSeconds - The expiration time for the counter window (e.g., 30 seconds).
 * @param {number} lockoutSeconds - The lockout period to enforce if the limit is exceeded (e.g., 60 seconds).
 * @returns {Promise<number>} - The current attempt count if under the limit.
 * @throws {HttpError} - Throws a 429 error if the limit is exceeded.
 */
/**
 * Implements a sliding-window rate limit.
 *
 * - On each call, we increment the counter under the given Redis key.
 * - If attempts <= limit, we reset the TTL to expireSeconds, so the user
 *   must wait a full expireSeconds of no calls for the counter to reset.
 * - If attempts > limit, we force a lockout TTL of lockoutSeconds and throw a 429.
 */
export async function checkRateLimit(key, limit, expireSeconds, lockoutSeconds) {
  // Increment the attempts counter
  const attempts = await redis.incr(key);

  if (attempts <= limit) {
    // For a sliding window, refresh the TTL on every valid call
    await redis.expire(key, expireSeconds);
  } else {
    // Once the user exceeds the limit, we forcibly set a lockout
    // so they can't call again for lockoutSeconds
    await redis.expire(key, lockoutSeconds);
    throw new HttpError(
      `You have reached the limit. Please try again in ${lockoutSeconds} hours.`,
      429
    );
  }

  return attempts;
}