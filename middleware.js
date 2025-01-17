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
        if (!response.ok) throw new Error('Failed to fetch session data');

        const { result } = await response.json();
        const sessionData = JSON.parse(result);

        if(!sessionData) {
            return NextResponse.redirect(new URL('/', req.url));
        }
        //Ensure users are redirected correctly after checkout
        if ((req.nextUrl.pathname.includes('/landing/thankyou') || req.nextUrl.pathname.includes('/landing/cancel')) && !sessionData.checkoutCompleted) {
            console.log("Redirecting because checkout was not completed or cancelled properly.");
            return NextResponse.redirect(new URL('/landing', req.url));
        }
        return NextResponse.next();
    } catch (error) {
        console.error('Middleware Error:', error);
        return NextResponse.redirect(new URL('/', req.url));
    }
}

export const config = {
    matcher: ['/landing/:path*', '/landing/cancel', '/landing/thankyou']
};