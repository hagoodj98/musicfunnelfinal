import crypto from 'crypto';
import redis from './redis';
import { serialize as serializeCookie } from 'cookie';
/**
 * Custom error class that includes an HTTP status code.
 */
export class HttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
/**
 * Retrieve the email mapping from Redis.
 * @param {string} email 
 * @returns {Promise<Object>} Parsed mapping object.
 * @throws {HttpError} 404 if mapping not found, 500 on Redis error.
 */
export async function getEmailMapping(email) {
    try {
      const mapping = await redis.get(`emailToHashMapping:${email}`);
//Checking if mapping exists. Again /subscribe creates two caches, if emailToHashMapping does not exists at this point, then the user never entered any data...

//This comment comes from /webhook/mailchimp;  

//This checks if this email even exists. If not, then that means the user has not submitted any data. If the user did, then a salt along with the emailHash would have been generated and stored in the emailToHashMapping key
      if (!mapping) throw new HttpError('Mapping not found', 404);
      return JSON.parse(mapping);
    } catch (error) {
       // If the error is already an instance of HttpError, rethrow it.
        if (error instanceof HttpError) {
            throw error;
        } 
        throw new HttpError(`Error retrieving email mapping: ${error.message}`, 500);
    }
  }
  /**
 * Retrieve session data using a session token.
 * @param {string} sessionToken 
 * @returns {Promise<Object>} Parsed session data.
 * @throws {HttpError} 404 if session not found, 500 on Redis error.
 */
export async function getSessionDataByToken(sessionToken) {
    try {
//Again if sessionDataString does not exist, then that means user did not confirm email yet. The reason why is because if user confirmed email, then the webhook would have set a session: key. 
      const sessionDataString = await redis.get(`session:${sessionToken}`);
         //Whenever I retrieve existing data, it is always good practice to check if exists.
      if (!sessionDataString){
        throw new HttpError('Session not found or expired', 401);
      } 
      return JSON.parse(sessionDataString); //// Now I have access to `email`, `name`, `status`
    } catch (error) {
        if (error instanceof HttpError){
            throw error;
        } 
        throw new HttpError(`Error retrieving session data: ${error.message}`, 500);
    }
  }
  /**
 * Retrieve session data using an email hash.
 * @param {string} emailHash 
 * @returns {Promise<Object>} Parsed session data.
 * @throws {HttpError} 404 if session not found, 500 on Redis error.
 */

export async function getSessionDataByHash(emailHash) {
    try {
      const sessionDataString = await redis.get(`session:${emailHash}`);
      if (!sessionDataString) throw new HttpError('Session not found', 404);
      return JSON.parse(sessionDataString);
    } catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError(`Error retrieving session data: ${error.message}`, 500);
    }
}
/**
 * Generates a secure token and salt.
 * @param {number} length - The number of bytes to use (default is 24).
 * @returns {Object} An object containing the token and salt as hex strings.
 */
export function generateTokenAndSalt(length = 24) {
    const token = crypto.randomBytes(length).toString('hex');
    const salt = crypto.randomBytes(length).toString('hex');
    return { token, salt };
  }

/**
 * Create a serialized cookie.
 * @param {string} name - Cookie name.
 * @param {string} value - Cookie value.
 * @param {object} options - Additional cookie options.
 * @returns {string} The serialized cookie string.
 * 
 *   //I have a cookie(sticker) (with its name, value, and instructions) and I needed to write all that information down in a specific format(into a string) so the website can understand it later. This string is then sent in the HTTP response headers with the Set-Cookie header.
 */
export function createCookie(name, value, options = {}) {
    return serializeCookie(name, value, {
      httpOnly: true,  //Cookie inaccesible tp JavaScript's Document.cookie API. This cookie(sticker) is in a locked envelope that only the server can open.
      secure: process.env.NODE_ENV !== 'development', //Use secure cookies in production. When the website is in production (not development), the cookie is only sent over a secure (encrypted) connection, so others can’t easily peek at it.
      path: '/', // This tells the cookie(sticker), “I belong everywhere in this place!”
      maxAge: 3600, // The cookie will expire after 3600 seconds (which is one hour). After that, the sticker is no longer valid.
      sameSite: 'strict',//With sameSite: 'strict', the cookie will only be sent if you are on the same site that set it, protecting it from being sent to other sites unintentionally.
      ...options, //other configuration options
    });
 //Parsing a cookie means taking that string (from the HTTP request’s Cookie header) and converting it back into an object that your code can work with
  }

  /**
 * Update the session data in Redis.
 * @param {string} sessionToken 
 * @param {Object} sessionData 
 * @param {number} ttl - Time-to-live in seconds.
 * @throws {HttpError} 500 on Redis error.
 */
//This function does not return anything, it just updates whats in Redis. The getSessionDataByToken helper function fetches what's been updated by updateSessionData   
export async function updateSessionData(sessionToken, sessionData, ttl = 3600) {
    try {
        await redis.set(`session:${sessionToken}`, JSON.stringify(sessionData), 'EX', ttl);
    } catch (error) {
        throw new HttpError(`Error updating session data: ${error.message}`, 500);
    }
  }
  /**
 * Extend the TTL of a session if it's about to expire.
 * @param {string} sessionToken 
 * @param {number} threshold - TTL threshold in seconds.
 * @param {number} extendBy - Seconds to extend by.
 */
export async function extendSessionTTLIfNeeded(sessionToken, threshold = 60, extendBy = 300) {
    const ttl = await redis.ttl(`session:${sessionToken}`);
    if (ttl < threshold) {
      await redis.expire(`session:${sessionToken}`, extendBy);
    }
  }

  