import { mailchimpClient } from "../../utils/mailchimp";
import crypto from "crypto";
import type { ErrorResponse } from "@mailchimp/mailchimp_marketing";
import {
  assertNoActiveSession,
  generateToken,
  updateSessionData,
  createCookie,
} from "../../utils/sessionHelpers";
import { validationSchema } from "../../utils/inputValidation";
import { handleFindEmailRateLimit } from "@/app/utils/limiterhelpers";
import { NextRequest } from "next/server";
import type { UserSession } from "../../types/types";
import z from "zod/v4";
import { HttpError } from "@/app/utils/errorhandler";
const listID = process.env.MAILCHIMP_LIST_ID as string;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    // Ensure no active session exists for this user. This check prevents users who are already logged in from initiating the subscription process again, which could lead to confusion or unintended consequences. By enforcing that there is no active session, we ensure that the subscription flow is only initiated for users who are not currently authenticated, maintaining a clear and secure user experience.
    await assertNoActiveSession();
    validationSchema.pick({ email: true }).parse({ email });

    // Implement rate limiting for email lookup to prevent abuse and brute-force attacks. This checks if the email has exceeded the allowed number of lookup attempts within a certain time frame. If the limit is exceeded, it will throw an error and prevent further processing of the request.
    await handleFindEmailRateLimit(email);

    // Generate the subscriber hash required by Mailchimp (MD5 hash of the lowercase email)
    const subscriberHash = crypto.createHash("md5").update(email).digest("hex");

    // Call Mailchimp's API to get the list member data
    let member: { status: string; merge_fields?: Record<string, unknown> };
    try {
      const memberResponse = await mailchimpClient.lists.getListMember(
        listID,
        subscriberHash,
      );

      if (
        !("status" in memberResponse) ||
        typeof memberResponse.status !== "string"
      ) {
        throw new HttpError("Unexpected Mailchimp response shape", 500);
      }

      member = memberResponse as {
        status: string;
        merge_fields?: Record<string, unknown>;
      };
    } catch (error: unknown) {
      // If Mailchimp returns a 404 error (member not found)
      if ((error as ErrorResponse).status === 404) {
        throw new HttpError(
          "Mhm we couldn't find that email. You should subscribe!🙃",
          404,
        );
      } else {
        throw new HttpError(
          "Error retrieving subscriber data from Mailchimp",
          500,
        );
      }
    }

    const { sessionToken, csrfToken } = generateToken();
    const firstName =
      typeof member.merge_fields?.["FNAME"] === "string"
        ? member.merge_fields["FNAME"]
        : "";

    // Prepare session data. You can add additional properties as needed.
    const sessionData: UserSession = {
      status: member.status as "pending" | "subscribed" | "failed",
      email: email,
      checkoutStatus: "active", // mark as active or however you define a successful session
      csrfToken,
      name: firstName,
      // Optionally include salt if you plan to use it later for verifying email mapping.
    };

    await updateSessionData(sessionToken, sessionData, 900);

    await createCookie("sessionToken", sessionToken, {
      maxAge: 900,
    });
    await createCookie("csrfToken", csrfToken, { maxAge: 900 });

    // Return a 200 response with the cookies set, and instruct the client to redirect to /landing.
    return new Response(
      JSON.stringify({ message: "Subscriber found. Redirecting to landing." }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in check-subscriber endpoint:", error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid email data. Please check your submission.",
          details: error.issues,
        }),
        { status: 400 },
      );
    }
    if (error instanceof HttpError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
      });
    }
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
