import redis from "../../utils/redis";

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
                throw new Error('Unsupported action');
        }
        return new Response(JSON.stringify({ result }), { status: 200 });
    } catch (error) {
        console.error('Redis Handler Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}