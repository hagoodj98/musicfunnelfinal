import { cookies } from './headersWrapper.js';
import redis from "../../utils/redis.js";
import { HttpError } from "../../utils/sessionHelpers.js";

export async function GET() {
 
    try {
           //Retrieve cookies from the request
        const cookieStore = cookies();
        const sessionToken = (await cookieStore).get('sessionToken')?.value;

        if (!sessionToken) {
            throw new HttpError('Session token not found' , 404);
        }
       
        const ttl = await redis.ttl(`session:${sessionToken}`);

        if (ttl === -2) {
            throw new HttpError('Session not found or expired' , 404);
        }
        //Return the TTL value
        return new Response(JSON.stringify({ ttl }), {status: 200 });
    } catch (error) {
        if (error instanceof HttpError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        return new Response( JSON.stringify({error: 'Internal Server Error', error}), { status:500 }); 
    }
}