import {
  assertNoActiveSession,
  createCookie,
  createSession,
  generateToken,
  getSessionDataByHash,
} from "@/app/utils/sessionHelpers";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { HttpError } from "@/app/utils/errorhandler";

import Stripe from "stripe";
import { processSuccessfulCheckout } from "@/app/utils/checkoutHelpers";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const stripeSessionId = url.searchParams.get("session_id");
    // If there is no session_id in the query params, it likely means that the user is being redirected here after subscribing through Mailchimp but has not gone through the Stripe checkout process. In this case, we want to check for the pending subscription cookie and the associated session data to confirm their subscription and issue them a session if everything checks out. If there is a session_id in the query params, it means the user is being redirected here after completing the Stripe checkout process, and we want to verify the session with Stripe, update our records accordingly, and then issue them a session and redirect to the thank you page.
    if (!stripeSessionId) {
      await assertNoActiveSession();
      // Check for the presence of the pendingSubscription cookie, which contains a hash of the user's email. This cookie is set when the user initiates the subscription process and is used to track the pending subscription status. If this cookie is not present, it indicates that there is no pending subscription associated with the request, and we should reject the request with a 400 Bad Request error, indicating that the pending data was not found and access is unauthorized.
      const cookieStore = await cookies();
      const emailHashPendingSubCookie = cookieStore.get(
        "pendingSubscription",
      )?.value;
      //If we are going to check the cookie here, we also want to check it over in mailchimp webhook before changing the status to subscribed.
      if (!emailHashPendingSubCookie) {
        throw new HttpError(
          "Pending data not found. Unauthorized access.",
          400,
        );
      }
      // Mailchimp fires the webhook and redirects the browser simultaneously, so the
      // sessionReadyForIssuance key may not exist yet when the browser arrives first.
      // Retry up to 30 times (30 s total) to let the webhook complete before giving up.
      let userSessionToBeIssued = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        try {
          userSessionToBeIssued = await getSessionDataByHash(
            emailHashPendingSubCookie,
          );
          break;
        } catch (err) {
          if (err instanceof HttpError && err.status === 404 && attempt < 30) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw err;
        }
      }
      //Dead code. Only to make typescript happy since it cant verify that the loop will always run at least once and assign userSessionToBeIssued. In reality, if the loop runs 0 times, it means there was an error with  getSessionDataByHash that was not a 404, and that error would be thrown and we would never reach this line. If the loop runs at least once, userSessionToBeIssued will either be assigned a value or an error will be thrown, so we would also never reach this line without userSessionToBeIssued being assigned.
      if (!userSessionToBeIssued) {
        throw new HttpError("Session not found", 404);
      }
      if (
        !userSessionToBeIssued.ttl ||
        userSessionToBeIssued.status !== "subscribed"
      ) {
        throw new HttpError("Unauthorized access", 401);
      }

      const ttl = userSessionToBeIssued.ttl;
      const { sessionToken, csrfToken } = generateToken();

      //Now we retrieved sessionToken from stripe and updated session data, we can safely redirect the user to the thank you page. We want to do this server-side to ensure that the redirection happens even if the user tries to access this endpoint directly without going through the Stripe redirection (e.g., by manually entering the URL with a valid session_id). By performing the redirection server-side, we can guarantee that users are directed to the appropriate page after completing their purchase, regardless of how they access this endpoint. We use a 302 Found status code for the redirection, which is appropriate for this use case since we want to temporarily redirect the user to the thank you page after a successful checkout session completion.
      await createSession(
        sessionToken,
        { ...userSessionToBeIssued, csrfToken },
        ttl,
      );

      await createCookie("sessionToken", sessionToken, { maxAge: ttl });
      await createCookie("csrfToken", csrfToken, { maxAge: ttl });
      //pendingCookie was just temporary. Its not needed anymore.
      cookieStore.delete("pendingSubscription");
      // Finally, we return a JSON response indicating that the user's email is confirmed, cookies have been issued, and include a redirectUrl to guide the frontend on where to navigate the user next. In this case, we redirect them to the landing page after confirming their email subscription. This allows us to provide a seamless user experience by automatically guiding the user to the appropriate page after confirming their email, without requiring them to manually navigate there. The frontend can use the redirectUrl in the response to programmatically redirect the user, ensuring that they end up on the landing page where they can explore our content and offerings after confirming their subscription.
      return NextResponse.json(
        {
          success: true,
          redirectUrl: `/landing`,
          sessionTTL: ttl,
        },
        {
          status: 200,
        },
      );
    }
    //implementation for handling the case when user is redirected from stripe after checkout. We want to check the session_id in the url, if it exists, we want to verify the session with stripe and then update the session data and mailchimp data accordingly before redirecting to the thank you page. We want to do this verification step to ensure that only users who have completed the checkout process can access the thank you page and have their session and mailchimp data updated, which is important for maintaining the integrity of our subscription flow and providing a seamless user experience. If we did not perform this verification step, it could lead to situations where users who have not completed the checkout process are able to access the thank you page and have their session and mailchimp data updated, which could cause confusion and potential issues with our subscription management.

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      apiVersion: "2026-03-25.dahlia",
    });
    // The way stripe redirection works is that after checkout, it will redirect the user to the return_url we specified in the checkout session creation, which includes the session_id as a query param. So when the user is redirected to this endpoint, we can get the session_id from the url and then call stripe API to retrieve the session details using that session_id. This allows us to verify the payment status of the session and ensure that the user has completed the checkout process before we proceed with updating their session and mailchimp data and redirecting them to the thank you page.
    const stripeSession =
      await stripe.checkout.sessions.retrieve(stripeSessionId);
    //Stripe webhook does the same update, it acts as a backup in case the user flow was interrupted before the redirection to this endpoint (e.g., user closes the browser before redirection, network issues, etc.). So in the case where the user is redirected to this endpoint but the stripe session is not paid, it likely means that there was an issue with the payment process or the user did not complete the payment, and we should reject the request with a 402 Payment Required error, indicating that the payment was not completed. This ensures that only users who have successfully completed their payment can proceed with accessing the thank you page and having their session and mailchimp data updated.
    if (stripeSession.payment_status !== "paid") {
      throw new HttpError("Payment not completed", 402);
    }
    // Now that we have verified that the payment was completed successfully, we can proceed with processing the successful checkout. This involves updating our session data to mark the checkout as completed and setting the appropriate TTL based on the user's rememberMe status, as well as updating the subscriber's address information in Mailchimp based on the shipping details collected during the Stripe checkout process. After processing the successful checkout, we can safely redirect the user to the thank you page, knowing that they have completed the necessary steps in the checkout process.
    await processSuccessfulCheckout(stripeSession);
    // After processing the successful checkout, we can safely redirect the user to the thank you page. We want to do this server-side to ensure that the redirection happens even if the user tries to access this endpoint directly without going through the Stripe redirection (e.g., by manually entering the URL with a valid session_id). By performing the redirection server-side, we can guarantee that users are directed to the appropriate page after completing their purchase, regardless of how they access this endpoint. We use a 302 Found status code for the redirection, which is appropriate for this use case since we want to temporarily redirect the user to the thank you page after a successful checkout session completion.
    return NextResponse.json({
      success: true,
      redirectUrl: `/landing/thankyou`,
    });
  } catch (error) {
    console.error("Error processing :", error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: (error as Error).message },
      {
        status: 500,
      },
    );
  }
}
