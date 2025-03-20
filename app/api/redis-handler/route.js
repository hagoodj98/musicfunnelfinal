import redis from "../../utils/redis.js";
import { HttpError } from "../../utils/sessionHelpers.js";

export async function POST(req) {
    const { action, key } = await req.json();
    try {
        let result = null;
        switch (action) {
            case 'get':
                result = await redis.get(key);
                break;
            case 'set':
                result = await redis.set(key, req.body.value);
                break;
            default:
                throw new HttpError('Unsupported action', 400);
        }
        return new Response(JSON.stringify({ result }), { status: 200 });
    } catch (error) {
        console.error('Redis Handler Error:', error);
        if (error instanceof HttpError) {
            return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}