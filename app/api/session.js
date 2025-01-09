
//The purpose of this file is for each time the user interacts with this application afterward (e.g., accessing a protected route or refreshing the page), the frontend needs to ensure the user is still validly logged in or subscribed. 

import redis from '../utils/redis';
import parseCookies from '../utils/parseCookies';

export async function GET(req) {
    parseCookies(req); //Parse cookies from the request

    //Extract the session token from cookies
    const sessionToken = req.cookies.sessionToken;
    
    if (!sessionToken) {
        return res.status(401).json({error: 'Session token is required'});
    }

    const sessionData = await redis.get(`session:${sessionToken}`);

    if (!sessionData) {
        return res.status(401).json({valid: false});
    }
    const sessionInfo = JSON.parse(sessionData);
    if (req.path.includes('/thankyou') && !sessionInfo.purchased) {
        return res.status(403).json({error: 'Access denied: No purchase found'});
    }
    return res.status(200).json({ valid: true });
}
