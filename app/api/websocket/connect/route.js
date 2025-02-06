import redis from '../../../utils/redis';

// Example for a connect handler in Next.js
export async function POST(req) {
    // Implement your logic for when a WebSocket connection is established
    console.log('WebSocket connected', req);
    const { connectionId } = req.headers; // AWS API Gateway sends this
    await redis.set(`ws${sessionToken}`, connectionId, 'EX', 3600); // Store connection with 1-hour expiration

    return new Response(JSON.stringify({message: 'Connection established'}), {status: 200 });
  }
  