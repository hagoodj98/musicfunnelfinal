import {
  createCookie,
  createSession,
  generateToken,
  getSessionDataByHash,
} from "@/app/utils/sessionHelpers";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { HttpError } from "@/app/utils/errorhandler";

export async function GET(req: NextRequest) {
  console.log(req);
  try {
    const cookieStore = await cookies();
    // The way mailchimp sets up its' opt in confirmation form, you have to pass it an Url to redirect to this endpoint after confirmation. There is no way to send params in the url in mailchimp. So when browser makes request to the server, it needs a email to reference and we can't get that from redis without a emailHash. That's why we want a pending cookie. When user enters in email, a confirmation will be sent. And we need a way to know when the user subscribes. If the user refreshes the page or step away for hours, polling on the client can get distrupted and there's no way to know if user subscribe in order to redirect them to the next page. So we want a cookie, to let us know when the browser makes a GET to this endpoint and the cookie is alive, then we can redirect them on the server instead of the client so the user dont get stuck on homepage after confirming email.
    const emailHashPendingSubCookie = cookieStore.get(
      "pendingSubscription",
    )?.value;
    //If we are going to check the cookie here, we also want to check it over in mailchimp webhook before changing the status to subscribed.
    if (!emailHashPendingSubCookie) {
      throw new HttpError(
        "Session not found. Unauthorized access. Pending cookie is required.",
        400,
      );
    }
    //calling this function does the same as getPrelimSession indirectly. If the hash from this cookie does not match the oen that was stored in redis, then throw.
    const userSessionToBeIssued = await getSessionDataByHash(
      emailHashPendingSubCookie,
    );
    if (
      !userSessionToBeIssued.ttl ||
      userSessionToBeIssued.status !== "subscribed"
    ) {
      throw new HttpError("Unauthorized access", 401);
    }

    const ttl = userSessionToBeIssued.ttl;
    const { sessionToken, csrfToken } = generateToken();

    await createSession(
      sessionToken,
      { ...userSessionToBeIssued, csrfToken },
      ttl,
    );

    await createCookie("sessionToken", sessionToken, { maxAge: ttl });
    await createCookie("csrfToken", csrfToken, { maxAge: ttl });
    //pendingCookie was just temporary. Its not needed anymore.
    cookieStore.delete("pendingSubscription");
    return new NextResponse(
      JSON.stringify({
        message: "User confirmed! Cookies issued",
        sessionTTL: ttl,
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing :", error);
    if (error instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: error.status,
      });
    }
    return new NextResponse(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
      },
    );
  }
}
