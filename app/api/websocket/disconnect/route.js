import { error } from 'console';
import redis from '../../../utils/redis';

// Example for a disconnect handler in Next.js
export async function POST(req) {
    try {
    // Implement your logic for when a WebSocket connection is disconnected

        console.log('WebSocket disconnecting', req);
        const { connectionId } = req.headers;
        if (!connectionId) {
            console.error('Disconnect Error: Missing connection ID');
            return new Response(JSON.stringify({error: 'Missing connection ID'}), {status: 400 })
        }
        //Remove connection from Redis
        await redis.del(`ws${connectionId}`);
        console.log(`WebSocket disconnected: ${connectionId}`);

        return new Response(JSON.stringify({message: 'Disconnected'}), {status: 200});
    } catch (error) {
        console.error("Disconnect Error:", error);
        return new Response(JSON.stringify({error: "Internal server error"}), {status:500});
        
    }
  }