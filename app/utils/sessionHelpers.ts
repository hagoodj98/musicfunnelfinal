import crypto from "crypto";
import { computeEmailHash } from "./cryptoHelpers";
import redis from "../../lib/redis";
import { UserSession } from "../types/types";
import { cookies } from "next/headers";
import { HttpError } from "./errorhandler";

export interface TokenBundle {
  /** Signed cookie & header pairing */
  sessionToken: string;
  /** CSRF token sent to the client as a cookie */
  csrfToken: string;
  /** Per‑session HMAC key for e‑mail hashing */
  secretSaltToken: string;
}
/**
 * Retrieve the email mapping from Redis.
 * @param {string} email
 * @returns {Promise<string> | Promise<object>} Parsed mapping object.
 * @throws {HttpError} 404 if mapping not found, 500 on Redis error.
 */
export async function getPrelimSession(email: string): Promise<UserSession> {
  try {
    const emailHashReference = (await redis.get(
      `emailReference:${email.toLowerCase()}`,
    )) as string | null;
    const emailHashStored = emailHashReference;
    if (!emailHashStored) {
      throw new HttpError("Email mapping not found. Unauthorized access", 404);
    }
    const pendingSession = await redis.get(`prelimSession:${emailHashStored}`);
    if (!pendingSession) {
      throw new HttpError("Session not found. Unauthorized access", 404);
    }
    const prelimSession = JSON.parse(pendingSession) as UserSession;
    const originalSalt = prelimSession.secretToken as string;
    const mailchimpEmail = computeEmailHash(originalSalt, email);

    // DEBUG: Print values for test troubleshooting

    console.log(
      "[DEBUG] emailHashStored:",
      emailHashStored,
      "| mailchimpEmail:",
      mailchimpEmail,
    );

    if (emailHashStored !== mailchimpEmail) {
      throw new HttpError("Unauthorized access", 401);
    }
    return prelimSession;
  } catch (error: unknown) {
    // If the error is already an instance of HttpError, rethrow it.
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(
      `Error retrieving email mapping: ${(error as Error).message}`,
      500,
    );
  }
}
/**
 * Retrieve session data using a session token.
 * @param {string} sessionToken
 * @returns {Promise<Object>} Parsed session data.
 * @throws {HttpError} 404 if session not found, 500 on Redis error.
 */
export async function getSessionDataByToken(
  sessionToken: string,
): Promise<UserSession> {
  try {
    const sessionDataString = await redis.get(`session:${sessionToken}`);
    if (!sessionDataString) {
      throw new HttpError("Session not found or expired", 404);
    }
    return JSON.parse(sessionDataString) as UserSession;
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(
      `Error retrieving session data: ${(error as Error).message}`,
      500,
    );
  }
}
/**
 * @param {string} emailHash
 * @returns {Promise<Object>} Parsed session data.
 * @throws {HttpError} 404 if session not found, 500 on Redis error.
 */

export async function getSessionDataByHash(
  emailHash: string,
): Promise<UserSession> {
  try {
    const sessionDataString = await redis.get(
      `sessionReadyForIssuance:${emailHash}`,
    );
    if (!sessionDataString) {
      throw new HttpError("Session not found", 404);
    }

    return JSON.parse(sessionDataString) as UserSession;
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(
      `Error retrieving session data: ${(error as Error).message}`,
      500,
    );
  }
}

export async function updateSessionData(
  sessionToken: string,
  sessionData: UserSession,
  ttl: number,
): Promise<void> {
  try {
    await redis.set(
      `session:${sessionToken}`,
      JSON.stringify(sessionData),
      "EX",
      ttl,
    );
  } catch (error: unknown) {
    throw new HttpError(
      `Error updating session data: ${(error as Error).message}`,
      500,
    );
  }
}
export const setTimeToLive = (rememberMe: boolean) => {
  return rememberMe ? 604800 : 600; // 1 week vs 10 minutes in seconds
};

/**
 * Generates a secure token.
 * @param {number} length - The number of bytes to use (default is 24).
 * @returns {object} An object containing the token and salt as hex strings.
 *  * Generates a secure token bundle.
 */
export const generateToken = (length: number = 24): TokenBundle => {
  const sessionToken = crypto.randomBytes(length).toString("hex");
  const csrfToken = crypto.randomBytes(length).toString("hex");
  const secretSaltToken = crypto.randomBytes(length).toString("hex");
  return { sessionToken, csrfToken, secretSaltToken };
};

/**
 * Create a serialized cookie.
 * @param {string} name - Cookie name.
 * @param {string} value - Cookie value.
 * @param {object} options - Additional cookie options.
 * @returns {Promise<string>} The serialized cookie string.
 *
 */
export async function createCookie(
  name: string,
  value: string,
  options: Record<string, unknown> = {},
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    ...options, //other configuration options
  });
}
/**
 * Create a new session in Redis.
 * @param {string} sessionToken
 * @param {Session} sessionData
 * @param {number} ttl - Time-to-live in seconds.
 * @throws {HttpError} 500 on Redis error.
 */

export async function createSession(
  sessionToken: string,
  sessionData: UserSession,
  ttl: number,
): Promise<void> {
  try {
    await redis.set(
      `session:${sessionToken}`,
      JSON.stringify(sessionData),
      "EX",
      ttl,
    );
  } catch (error: unknown) {
    throw new HttpError(
      `Error creating session: ${(error as Error).message}`,
      500,
    );
  }
}

/**
 * Asserts that no active session cookies exist on the current request.
 * - Both cookies present → user already has a session → throws 403.
 * - Only one cookie present → inconsistent / tampered state → cleans up Redis
 *   and cookies, then throws 403.
 *
 * Call this at the top of any endpoint that must only be reached before a
 * session has been issued (e.g. /email-confirmation, /check-subscriber).
 */
export async function assertNoActiveSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sessionToken")?.value;
  const csrfToken = cookieStore.get("csrfToken")?.value;

  if (sessionToken && csrfToken) {
    throw new HttpError(
      "User already has an active session. Unauthorized access.",
      403,
    );
  }
  if (sessionToken || csrfToken) {
    // If only one of the cookies is present, we treat this as an inconsistent state (potentially due to tampering or a previous error). To mitigate any potential security risks, we clean up any existing session in Redis associated with the sessionToken and delete both cookies to ensure a clean slate for the user. After performing this cleanup, we throw a 403 Forbidden error to indicate that the request is unauthorized due to the inconsistent state of the session cookies.
    if (sessionToken) {
      const isActiveSession = await redis.exists(`session:${sessionToken}`);
      if (isActiveSession) {
        await redis.del(`session:${sessionToken}`);
      }
    }
    cookieStore.delete("sessionToken");
    cookieStore.delete("csrfToken");
    throw new HttpError(
      "Session cookies are in an inconsistent state. Unauthorized access.",
      403,
    );
  }
}

export const createPrelimSession = async (
  email: string,
  name: string,
  rememberMe?: boolean,
): Promise<string> => {
  const { secretSaltToken } = generateToken();
  const emailHash = crypto
    .createHmac("sha256", secretSaltToken)
    .update(email)
    .digest("hex");
  const ttl = setTimeToLive(rememberMe || false); // 1 week vs 10 minutes
  const preliminarysessionData: UserSession = {
    email,
    name,
    status: "pending",
    rememberMe: rememberMe || false,
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
  return emailHash;
};
