import { mailchimpClient } from "../../utils/mailchimp";
import crypto from "crypto";
import {
  HttpError,
  generateTokenAndSalt,
  updateSessionData,
  createCookie,
} from "../../utils/sessionHelpers";
import { validationSchema } from "../../utils/zodValidation";
import redis from "../../../lib/redis";
import { NextRequest } from "next/server";

const listID = process.env.MAILCHIMP_LIST_ID as string;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    validationSchema.pick({ email: true }).parse({ email });

    // Use a unified key for rate limiting (e.g., for "Find Me")
    const rateLimitKey = `findMeLimit:${email}`;
    const attempts = await redis.incr(rateLimitKey);
    // On the first attempt, set a TTL for 30 seconds.
    if (attempts === 1) {
      await redis.expire(rateLimitKey, 30);
    }
    // Payment link logic has been removed.

    // Check if this email was flagged as not found.
    const notFoundKey = `notFound:${email}`;
    const notFoundFlag = await redis.get(notFoundKey);
    if (notFoundFlag) {
      throw new HttpError(
        "We couldn't find that email. So please subscribe first!",
        404,
      );
    }

    // Generate the subscriber hash required by Mailchimp (MD5 hash of the lowercase email)
    const subscriberHash = crypto
      .createHash("md5")
      .update(email.toLowerCase())
      .digest("hex");

    // Call Mailchimp's API to get the list member data
    let member;
    try {
      member = await mailchimpClient.lists.getListMember(
        listID,
        subscriberHash,
      );
    } catch (error) {
      // If Mailchimp returns a 404 error (member not found)
      if (error.status === 404) {
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

    const { sessionToken, csrfToken } = generateTokenAndSalt();
    // Prepare session data. You can add additional properties as needed.
    const sessionData = {
      email,
      checkoutStatus: "active", // mark as active or however you define a successful session
      csrfToken,
      name: member.merge_fields?.FNAME || "",
      // Optionally include salt if you plan to use it later for verifying email mapping.
    };

    await updateSessionData(sessionToken, sessionData, 900);

    const sessionCookie = createCookie("sessionToken", sessionToken, {
      maxAge: 900,
    });
    const csrfCookie = createCookie("csrfToken", csrfToken, { maxAge: 900 });

    // Return a 200 response with the cookies set, and instruct the client to redirect to /landing.
    return new Response(
      JSON.stringify({ message: "Subscriber found. Redirecting to landing." }),
      {
        status: 200,
        headers: {
          "Set-Cookie": [sessionCookie, csrfCookie],
          Location: "/landing",
        },
      },
    );
  } catch (error) {
    console.error("Error in check-subscriber endpoint:", error);
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
