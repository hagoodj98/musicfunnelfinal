
import { cookies } from "next/headers";
import redis from "../../utils/redis";

export async function GET(req) {
    //Retrieve cookies from the request
    const cookieStore = cookies();
    const sessionToken = (await cookieStore).get('sessionToken')?.value;

    if (!sessionToken) {
        return new Response(
            JSON.stringify({ error: 'Session token not found' }),
            { status: 401 }
          );
    }
    try {
        //Get the remaining TTL for the session from Redis that we updated in /check-status using the key redis.set(`session:${sessionToken}`
        const ttl = await redis.ttl(`session:${sessionToken}`);

/**
 * In Redis, when you use the TTL command to check how much time a key has before it expires, it returns special values to indicate different situations:
	•	-2: This value means that the key does not exist at all in Redis.
	•	-1: This value means that the key exists but does not have an expiration set.
 */
// If ttl returns -2, the key does not exists. It’s explaining that a return value of -2 tells you that the key you’re asking about isn’t there, so there’s nothing to check the remaining time for.
        if (ttl === -2) {
            return new Response(
        //The session either does not exist or expired. 
            JSON.stringify({ error: 'Session not found or expired' }),
            { status: 404 }
            );
        }
        //Return the TTL value
        return new Response(JSON.stringify({ ttl }), {status:200 });
    } catch (error) {
        return new Response( JSON.stringify({error: 'Internal Server Error', error}), { status:500 }); 
    }
}