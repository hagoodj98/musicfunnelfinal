import redis from "../utils/redis";
import { NextResponse } from 'next/server';

export async function middleware(req) {
    const sessionToken = req.cookies.get('sessionToken');
    if (!sessionToken) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    const sessionData = await redis.get(`session:${sessionToken}`);
    if (!sessionData) {
        //Rediret to home page if session is not valid or expired
        return NextResponse.redirect(new URL('/', req.url));
    }
    // Parse session data and check for purchase if accessing the thank you page
    const sessionInfo = JSON.parse(sessionData);
    if (req.nextUrl.pathname.includes('/thankyou') && !sessionInfo.purchased) {
        //Redirect to home with a potential query to show a message or just redirect
        return NextResponse.redirect(new URL('/', req.url));
    }
    
    //Allow the request to continue in the pipeline if all checks pass
    return NextResponse.next();
}
export const config = {
    matcher: ['/landing/:path*', '/landing/cancel', '/landing/thankyou']
};