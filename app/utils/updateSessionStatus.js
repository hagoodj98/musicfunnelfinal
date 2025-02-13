import redis from '../utils/redis';


/**
 * Updates the checkoutStatus of a session in Redis.
 * @param {string} sessionToken - The key for the session in Redis.
 * @param {string} newStatus - The new checkout status (e.g., 'completed', 'expired').
 * @param {number} expiration - The time-to-live for the session key (in seconds). Default is 3600.
 */
export async function updateSessionStatus(sessionToken, newStatus, expiration = 3600) {
    if (!sessionToken) {
      console.error("Session token is missing");
      return;
    }
  
    // Retrieve the session data from Redis
    const sessionDataString = await redis.get(`session:${sessionToken}`);
    if (!sessionDataString) {
      console.warn(`No session data found for sessionToken: ${sessionToken}`);
      return;
    }
  
    // Parse, update, and save the session data
    const sessionData = JSON.parse(sessionDataString);
    sessionData.checkoutStatus = newStatus;
  
    try {
      await redis.set(`session:${sessionToken}`, JSON.stringify(sessionData), 'EX', expiration);
      console.log(`Session ${sessionToken} updated to ${newStatus}`);
    } catch (err) {
      console.error(`Error updating session data for sessionToken: ${sessionToken}`, err);
    }
  }