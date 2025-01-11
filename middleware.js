import { NextResponse } from "next/server";

export async function middleware(req) {
    console.log("Middleware is running");
    const sessionToken = req.cookies.get('sessionToken');
    // Redirect if no session token is found
    if (!sessionToken) {
        console.log("No session token found, redirecting...");
        return NextResponse.redirect(new URL('/', req.url));
    }
    try {
        const response = await fetch(`${req.nextUrl.origin}/api/redis-handler?action=get&key=session:${sessionToken}`);
        const { result } = await response.json();
        if(!result) {
            return NextResponse.redirect(new URL('/', req.url));
        }
        const sessionData = JSON.parse(result);
        if (sessionData && sessionData.purchased) {
            return NextResponse.next();
        } else {
            return NextResponse.redirect(new URL('/', req.url));
        }
    } catch (error) {
        console.error('Middleware Error:', error);
        return NextResponse.redirect(new URL('/', req.url));
    }
}

export const config = {
    matcher: ['/landing/:path*', '/landing/cancel', '/landing/thankyou']
};