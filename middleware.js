import { NextResponse } from "next/server";

export async function middleware(req) {
    console.log("Middleware is running");
    //This one-liner uses optional chaining to safely access the .value property of the cookie, 
    //We don't have to fetch the cookie cause Nextjs middleware has campitablits to do that for us. So we can just grab it.
    const sessionToken = req.cookies.get('sessionToken')?.value;
    // Redirect if no session token is found. This means that the cookie called sessionToken which I set in /check-status has expired or invalid. Redirect the user back to squeeze page
    if (!sessionToken) {
        console.log("No session token found, redirecting...");
        const redirectUrl = new URL('/', req.url);
        const message = 'You cannot proceed!'; 
            
                //This will redirect the user to something like:/landing?msg=Your%20checkout%20session%20expired.%20Please%20try%20again.
        redirectUrl.searchParams.append('msg', encodeURIComponent(message));
        return NextResponse.redirect(redirectUrl);
    }
    //If the cookie does exist, whatever the next url is ${req.nextUrl.origin}, go ahead and make a request to the redis-handler since this middleware only exists in the edge environment. Meaning, node is very limtied. So we have to make a request to an endpoint that can handle node normally.
    try {
        //Again the reason why I am making a request to redis-handler is because this helps restrict the /landing/thankyou route. We want to get the sessionToken that the middleware just validated. As i would normally use a redis.get(), i set the action to get and the key to session:${sessionToken}. 
        const response = await fetch(`${req.nextUrl.origin}/api/redis-handler`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'get', key: `session:${sessionToken}` }) 
        });
        //I verify that the request was successful by checking !response.ok
        if (!response.ok) throw new Error('Failed to fetch session data');
//I grab the result variable I set in the redis-handler and grabbed the code under the event case that the switch statement detected.I set reset to result = await redis.get(key);. Then I return that result in the response along with the status code
        const { result } = await response.json();
//The result gets the key from redis for me. sessionData becomes a json object for use from that redis key
        const sessionData = JSON.parse(result);
//Its good to always check if the new json obejct exists. 
        if(!sessionData) {
            return NextResponse.redirect(new URL('/', req.url));
        }
//Since I rotated tokens and the new session data now contains a new CSRF token in /create-checkout-session, i want the middleware to verify that the CSRF token in the request (from the cookie) matches the new one stored in the session. This would help confirm that the session data being used is indeed the updated one. More importantly, it ensures the middleware is truly working with the updated session data—not just the session token name, but the new value (and new CSRF) that I expected. The reason why this is necessary is because i am using the same sessionToken name that the middleware is looking for. So to make sure the middleware is looking at the right sessionToken is by verifying the new csrf.
        const csrfFromCookie = req.cookies.get('csrf')?.value;
/*
*Imagine the session is like a secret club membership, and your CSRF token is like your secret handshake. When you first join the club, you get a certain handshake (the CSRF token) that’s stored on your membership card (the cookie) and in the club’s records (the session data in Redis).

Now, if for extra security the club decides to change the handshake (rotate the tokens), they give you a new secret handshake and update your membership record. Your membership card (the cookie) is also updated with the new handshake.

When you go to the club gate (which is like the middleware), the guard asks you for your secret handshake. The guard then checks the membership record to see what the current, new handshake should be. If what you show (csrfFromCookie) matches the new handshake in the record (sessionData.csrf), you’re allowed in. If not, then something is wrong and you’re not allowed in. 
         */
        if (!csrfFromCookie || csrfFromCookie !== sessionData.csrf) {
//When the CSRF tokens don’t match, it indicates a potential security issue. Redirecting the user to the home page (”/”)—rather than leaving them on /landing where they might click “Buy Now” again—ensures that i take the user back to a safer, more controlled starting point. This minimizes any risk by forcing the user to reinitiate the process from the very beginning, which is a more secure approach when there’s a possible threat.
            console.error("CSRF token mismatch or missing");
            return NextResponse.redirect(new URL('/',req.url));
        }

//Ensure users are redirected correctly after checkout. If a user ever try to include /landing/thankyou in the url and the sessionData, coming from the sessionToken i just verified; AND the checkoutStatus is not set to completed, then redirect the user back to /landing. The checkoutStatus property is updated after user completes the stripe form. I have a stripe webhook that lets me know if user completed-checkout-session. If so, then update the checkoutStatus to completed using redis.
        if (req.nextUrl.pathname.includes('/landing/thankyou') && sessionData.checkoutStatus !== 'completed') {
            console.log("Redirecting because checkout was not completed or canceled properly.");
            //When something goes wrong (like the checkout was cancelled), the middleware adds a little note (message) to the URL. It’s like attaching a sticky note to a package saying, “Oops, something went wrong!”
            const redirectUrl = new URL('/landing', req.url);
            if (sessionData.message) {
                //This will redirect the user to something like:/landing?msg=Your%20checkout%20session%20expired.%20Please%20try%20again.
                redirectUrl.searchParams.append('msg', encodeURIComponent(sessionData.message));
            }
            return NextResponse.redirect(redirectUrl);
        }
        return NextResponse.next();
    } catch (error) {
        console.error('Middleware Error:', error);
        return NextResponse.redirect(new URL('/', req.url));
    }
}

export const config = {
    matcher: ['/landing/:path*', '/landing/thankyou']
};