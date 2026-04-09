import { mailchimpClient } from "@/app/utils/mailchimp";
import Bottleneck from "bottleneck";
import {
  assertNoActiveSession,
  createCookie,
  createPrelimSession,
  setTimeToLive,
} from "../../utils/sessionHelpers";
import type { ErrorResponse } from "@mailchimp/mailchimp_marketing";
import { NextRequest, NextResponse } from "next/server";
import { validationSchema } from "../../utils/inputValidation";
import z from "zod/v4";
import { handleSubscribeRateLimit } from "../../utils/limiterhelpers";
import { checkEnvVariables } from "../../../environmentVarAccess";
import { HttpError } from "@/app/utils/errorhandler";
import {
  isDisposableEmailDomain,
  isObviousJunkEmail,
  isObviousJunkName,
} from "../../utils/inputValidation";

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
    if (!payload) {
      throw new HttpError("Request body is required", 400);
    }
    // Run cheap filters:
    // Normalize email (trim + lowercase). This ensures that we treat "
    const { email, name, rememberMe } =
      await validationSchema.parseAsync(payload);
    // 1. Ensure no active session exists for this user. This check prevents users who are already logged in from initiating the subscription process again, which could lead to confusion or unintended consequences. By enforcing that there is no active session, we ensure that the subscription flow is only initiated for users who are not currently authenticated, maintaining a clear and secure user experience.
    try {
      await assertNoActiveSession();
    } catch (error) {
      if (
        error instanceof HttpError &&
        error.message.includes("inconsistent state")
      ) {
        // If the error is due to an inconsistent state of session cookies, we redirect the user to the homepage. This allows them to start fresh and ensures that any potential issues with their current session are resolved before they attempt to subscribe again.
        throw new HttpError(
          "Session data is in an inconsistent state. Redirecting to homepage.",
          403,
        );
      }
    }

    //    2. Block disposable domains. This checks if the email domain is in a known list of disposable email providers. If it is, we reject the subscription attempt with a 400 Bad Request error, indicating that disposable email addresses are not allowed.
    if (isDisposableEmailDomain(email)) {
      throw new HttpError(
        "Disposable email addresses are not allowed. Please use a personal or business email.",
        400,
      );
    }
    //    3. Block malformed/obvious junk patterns.
    if (isObviousJunkEmail(email)) {
      throw new HttpError(
        "Invalid email address. Please use a valid personal or business email.",
        400,
      );
    }
    //    3. Block malformed/obvious junk patterns for names as well.
    if (isObviousJunkName(name)) {
      throw new HttpError("Invalid name. Please provide a valid name.", 400);
    }
    //limiter to prevent abuse of the subscribe endpoint. This checks if the email has exceeded the allowed number of subscription attempts within a certain time frame. If the limit is exceeded, it will throw an error and prevent further processing of the subscription request. So we dont need to limit session token creation here, because if someone is trying to abuse the subscribe endpoint, they are likely doing it with different emails, so we limit based on email instead of session token. If we limited based on session token, they could just create new sessions and bypass the limiter.
    await handleSubscribeRateLimit(email, setTimeToLive(rememberMe || false));

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

    return NextResponse.json(
      {
        message:
          "Subscription initiated. Please check your email to confirm. Don't see it, check spam!!",
        emailHash,
        status: "pending",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error during subscription process:", error);

    // If the error is already an instance of HttpError, use its status and message.

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input data. Please check your submission.",
          details: error.issues,
        },
        { status: 400 },
      );
    }
    // For other types of errors, we check if it's an instance of HttpError (which we throw intentionally in our code for known error cases) and return its message and status. If it's not an HttpError, we return a generic 500 Internal Server Error with the error message if available.
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    // Otherwise, return a generic 500 Internal Server Error.
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during the subscription process.",
      },
      { status: 500 },
    );
  }
}
