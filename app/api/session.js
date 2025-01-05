
//The purpose of this file is for each time the user interacts with this application afterward (e.g., accessing a protected route or refreshing the page), the frontend needs to ensure the user is still validly logged in or subscribed. 

import redis from '../utils/redis';
import parseCookies from '../utils/parseCookies';

export async function GET(req) {
    parseCookies(req); //Parse cookies from the request

    //Extract the session token from cookies
    const sessionToken = req.cookies.sessionToken;
    
    if (!sessionToken) {
        return new Response(JSON.stringify({error: 'Session token is required'}), {status: 401});
    }

    const sessionData = await redis.get(`session:${sessionToken}`);

    if (sessionData) {
        return new Response(JSON.stringify({valid: true}), { status: 200 });
    } else {
        return new Response(JSON.stringify({valid: false }), { status: 200 });
    }
}