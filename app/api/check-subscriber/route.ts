import { mailchimpClient } from "../../utils/mailchimp";
import crypto from "crypto";
import type { ErrorResponse } from "@mailchimp/mailchimp_marketing";
import {
  generateToken,
  updateSessionData,
  createCookie,
} from "../../utils/sessionHelpers";
import { getClientIp } from "../../utils/iphelpers";
import { validationSchema } from "../../utils/zodValidation";
import redis from "../../../lib/redis";
import ipRateLimiter from "../../../lib/iplimiter";
import { NextRequest } from "next/server";
import type { UserSession } from "../../types/types";
import z from "zod/v4";
import { HttpError } from "@/app/utils/errorhandler";

const listID = process.env.MAILCHIMP_LIST_ID as string;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    validationSchema.pick({ email: true }).parse({ email });

    const clientIp = getClientIp(req);
    try {
      await ipRateLimiter.consume(clientIp);
    } catch (rateLimitError: unknown) {
      const retryAfterSeconds =
        typeof rateLimitError === "object" &&
        rateLimitError !== null &&
        "msBeforeNext" in rateLimitError
          ? Math.ceil(Number(rateLimitError.msBeforeNext) / 1000)
          : 60;

      throw new HttpError(
        `Too many attempts from this IP. Try again in ${retryAfterSeconds} seconds.`,
        429,
      );
    }

    // Check if this email was flagged as not found.
    const notFoundKey = `notFound:${email}`;
    const notFoundFlag = await redis.get(notFoundKey);
    if (notFoundFlag) {
      throw new HttpError(
        "We couldn't find that email. Try again in 24 hours",
        404,
      );
    }

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
        await redis.set(notFoundKey, "true", "EX", 86400);
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
