import { json } from "stream/consumers";
import redis from "../../utils/redis";

export default async function loader({params}) {
    const { action, key } = params;
    try {
        let result = null;
        switch (action) {
            case 'get':
                result = await redis.get(key);
                break;
            case 'set':
                result = await redis.set(key, params.value);
                break;
            default:
                throw new Error('Unsupported action');
        }
        return { json: { result } };
    } catch (error) {
        console.error('Redis Handler Error:', error);
        throw error;
    }
}