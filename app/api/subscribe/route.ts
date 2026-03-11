import { mailchimpClient } from "@/app/utils/mailchimp";
import Bottleneck from "bottleneck";
import { HttpError, createPrelimSession } from "../../utils/sessionHelpers";
import { NextRequest, NextResponse } from "next/server";
import { validationSchema } from "../../utils/zodValidation";
import z from "zod/v4";

// Bottleneck limiter configuration
const limiter = new Bottleneck({
  maxConcurrent: 1, // Only one function runs at a time. Only one call to the wrapped function will execute at any given moment.
  minTime: 200, // Wait at least 200 milliseconds between each function call. After one call completes, Bottleneck will wait 200 milliseconds before starting the next call.
});

const listID = process.env.MAILCHIMP_LIST_ID;

//adding the subscriber
export async function POST(req: NextRequest) {
  // Validate email is provided and in proper format

  try {
    const payload = await req.json();

    const { email, name, rememberMe } =
      await validationSchema.parseAsync(payload);

    if (!listID) {
      throw new HttpError(
        "Server config error: MAILCHIMP_LIST_ID is missing.",
        500,
      );
    }

    const addSubscriber = limiter.wrap(async (email: string, name: string) => {
      const response = await mailchimpClient.lists.addListMember(listID, {
        email_address: email,
        status: "pending",
        merge_fields: { FNAME: name },
      });

      return response;
    });

    // Call the rate-limited function
    await addSubscriber(email, name);

    await createPrelimSession(email, name, rememberMe);

    return new NextResponse(
      JSON.stringify({
        message:
          "Subscription initiated. Please check your email to confirm. Don't see it, check spam!!",
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
