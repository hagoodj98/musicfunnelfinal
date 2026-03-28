import { mailchimpClient } from "@/app/utils/mailchimp";
import Bottleneck from "bottleneck";
import {
  createCookie,
  createPrelimSession,
  setTimeToLive,
} from "../../utils/sessionHelpers";
import type { ErrorResponse } from "@mailchimp/mailchimp_marketing";
import { NextRequest, NextResponse } from "next/server";
import { validationSchema } from "../../utils/zodValidation";
import z from "zod/v4";
import { cookies } from "next/headers";
import { handleSubscribeRateLimit } from "../../utils/limiterhelpers";
import { checkEnvVariables } from "../../../environmentVarAccess";
import { HttpError } from "@/app/utils/errorhandler";
type MailchimpWrapped = ErrorResponse & {
  response?: { body?: { title?: string } };
};

// Bottleneck limiter configuration
const limiter = new Bottleneck({
  maxConcurrent: 1, // Only one function runs at a time. Only one call to the wrapped function will execute at any given moment.
  minTime: 200, // Wait at least 200 milliseconds between each function call. After one call completes, Bottleneck will wait 200 milliseconds before starting the next call.
});

//adding the subscriber
export async function POST(req: NextRequest) {
  // Validate email is provided and in proper format

  try {
    const payload = await req.json();

    const { email, name, rememberMe } =
      await validationSchema.parseAsync(payload);

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    const csrfToken = cookieStore.get("csrfToken")?.value;

    // layer to prevent users from resubmitting email if there is an active session
    if (sessionToken || csrfToken) {
      throw new HttpError(
        "You already have an active session. Redirecting...",
        401,
      );
    }

    //limiter to prevent abuse of the subscribe endpoint. This checks if the email has exceeded the allowed number of subscription attempts within a certain time frame. If the limit is exceeded, it will throw an error and prevent further processing of the subscription request.
    await handleSubscribeRateLimit(email);

    const addSubscriber = limiter.wrap(async (email: string, name: string) => {
      try {
        const listID = checkEnvVariables().listID;
        const response = await mailchimpClient.lists.addListMember(listID, {
          email_address: email,
          status: "pending",
          merge_fields: { FNAME: name },
        });

        return response;
      } catch (error: unknown) {
        if (
          (error as MailchimpWrapped).response?.body?.title === "Member Exists"
        ) {
          throw new HttpError("Mailchimp: User already subscribed", 400);
        }
      }
    });

    const ttl = setTimeToLive(rememberMe || false); // 1 week vs 15 minutes

    // Call the rate-limited function
    await addSubscriber(email, name);

    const emailHash = await createPrelimSession(email, name, rememberMe);
    await createCookie("pendingSubscription", emailHash, {
      maxAge: ttl,
      sameSite: "lax",
    });

    return new NextResponse(
      JSON.stringify({
        message:
          "Subscription initiated. Please check your email to confirm. Don't see it, check spam!!",
        emailHash,
        status: "pending",
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error during subscription process:", error);

    // If the error is already an instance of HttpError, use its status and message.

    if (error instanceof z.ZodError) {
      console.log(error);

      return new NextResponse(
        JSON.stringify({
          error: "Invalid input data. Please check your submission.",
          details: error.issues,
        }),
        { status: 400 },
      );
    }
    if (error instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: error.status,
      });
    }
    // Otherwise, return a generic 500 Internal Server Error.
    return new NextResponse(
      JSON.stringify({
        error:
          "Subscription failed due to being a member already or an internal error has occured. **Please check your inbox (and spam folder) and make sure you confirmed your subscription first or send an email for support. ",
      }),
      { status: 500 },
    );
  }
}
