import crypto from 'crypto';
import redis from './redis.js';
import { serialize as serializeCookie } from 'cookie';

export class HttpError extends Error {
    constructor(message, status) {
      super(message);      // Calls the parent Error class constructor with the message.
      this.status = status; // Sets a custom property 'status' that holds the HTTP status code.
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
      const sessionDataString = await redis.get(`session:${sessionToken}`);
      
      if (!sessionDataString){
        throw new HttpError('Session not found or expired', 404);
      } 
      return JSON.parse(sessionDataString); 
    } catch (error) {
        if (error instanceof HttpError){
            throw error;
        } 
        throw new HttpError(`Error retrieving session data: ${error.message}`, 500);
    }
  }
  /**
 * @param {string} emailHash 
 * @returns {Promise<Object>} Parsed session data.
 * @throws {HttpError} 404 if session not found, 500 on Redis error.
 */

export async function getSessionDataByHash(emailHash) {
    try {
      const sessionDataString = await redis.get(`session:${emailHash}`);
      if (!sessionDataString) {
        throw new HttpError('Session not found', 404);
      } 
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
    const sessionToken = crypto.randomBytes(length).toString('hex');
    const csrfToken = crypto.randomBytes(length).toString('hex');
    const salt = crypto.randomBytes(length).toString('hex');
    return { sessionToken, csrfToken, salt };
  }

/**
 * Create a serialized cookie.
 * @param {string} name - Cookie name.
 * @param {string} value - Cookie value.
 * @param {object} options - Additional cookie options.
 * @returns {string} The serialized cookie string.
 * 
 */
export function createCookie(name, value, options = {}) {
    return serializeCookie(name, value, {
      httpOnly: true,  
      secure: process.env.NODE_ENV !== 'development', 
      path: '/', 
      maxAge: 3600, 
      sameSite: 'strict',
      ...options, //other configuration options
    });

  }
  /**
 * Update the session data in Redis.
 * @param {string} sessionToken 
 * @param {Object} sessionData 
 * @param {number} ttl - Time-to-live in seconds.
 * @throws {HttpError} 500 on Redis error.
 */
 
export async function updateSessionData(sessionToken, sessionData, ttl) {
    try {
        await redis.set(`session:${sessionToken}`, JSON.stringify(sessionData), 'EX', ttl);
    } catch (error) {
        throw new HttpError(`Error updating session data: ${error.message}`, 500);
    }
  }
  
  