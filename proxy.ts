import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  //This one-liner uses optional chaining to safely access the .value property of the cookie,
  //We don't have to fetch the cookie cause Nextjs middleware has campitablits to do that for us. So we can just grab it.
  const sessionToken = req.cookies.get("sessionToken")?.value;
  // Redirect if no session token is found. This means that the cookie called sessionToken which I set in /check-status has expired or invalid. Redirect the user back to squeeze page
  if (!sessionToken) {
    const redirectUrl = new URL("/", req.url);
    const message = "You cannot proceed without an active session!!";

    //This will redirect the user to something like:/landing?msg=Your%20checkout%20session%20expired.%20Please%20try%20again.
    redirectUrl.searchParams.append("msg", encodeURIComponent(message));
    return NextResponse.redirect(redirectUrl);
  }
  //If the cookie does exist, whatever the next url is ${req.nextUrl.origin}, go ahead and make a request to the redis-handler since this middleware only exists in the edge environment. Meaning, node is very limtied. So we have to make a request to an endpoint that can handle node normally.
  try {
    //Again the reason why I am making a request to redis-handler is because this helps restrict the /landing/thankyou route. We want to get the sessionToken that the middleware just validated. As i would normally use a redis.get(), i set the action to get and the key to session:${sessionToken}.
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/redis-handler`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify({ action: "get", key: `session:${sessionToken}` }),
      },
    );
    //I verify that the request was successful by checking !response.ok
    if (!response.ok) throw new Error("Failed to fetch session data");
    //I grab the result variable I set in the redis-handler and grabbed the code under the event case that the switch statement detected.I set reset to result = await redis.get(key);. Then I return that result in the response along with the status code
    const { result } = await response.json();
    //The result gets the key from redis for me. sessionData becomes a json object for use from that redis key
    const sessionData = JSON.parse(result);
    //Its good to always check if the new json obejct exists.
    if (!sessionData) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // ONLY check CSRF if user is heading to /landing/thankyou
    if (req.nextUrl.pathname.includes("/landing/thankyou")) {
      const csrfFromCookie = req.cookies.get("csrfToken")?.value;

      if (!csrfFromCookie || csrfFromCookie !== sessionData.csrfToken) {
        console.error("CSRF token mismatch or missing");
        return NextResponse.redirect(new URL("/", req.url));
      }
      // Also ensure checkoutStatus is completed//Ensure users are redirected correctly after checkout. If a user ever try to include /landing/thankyou in the url and the sessionData, coming from the sessionToken i just verified; AND the checkoutStatus is not set to completed, then redirect the user back to /landing. The checkoutStatus property is updated after user completes the stripe form. I have a stripe webhook that lets me know if user completed-checkout-session. If so, then update the checkoutStatus to completed using redis.
      if (sessionData.checkoutStatus !== "completed") {
        //When something goes wrong (like the checkout was cancelled), the middleware adds a little note (message) to the URL. It’s like attaching a sticky note to a package saying, “Oops, something went wrong!”
        const redirectUrl = new URL("/landing", req.url);
        const message =
          "Redirecting to landing page. No checkout was completed";

        //This will redirect the user to something like:/landing?msg=Your%20checkout%20session%20expired.%20Please%20try%20again.
        redirectUrl.searchParams.append("msg", encodeURIComponent(message));
        return NextResponse.redirect(redirectUrl);
      }
    }
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/landing/:path*", "/landing/thankyou"],
};
