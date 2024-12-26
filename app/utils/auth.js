import redis from '@/app/utils/redis';


export async function validateSession(sessionToken) {
    if (!sessionToken) {
        return false; //Immediate reutnr if no token is provided
    }
    const sessionData = await redis.get(`session:${sessionToken}`);
    return !!sessionData; //Convert truthy/falsy value to boolean
}