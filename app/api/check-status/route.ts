import {
  getPrelimSession,
  getSessionDataByHash,
  generateToken,
  createCookie,
  createSession,
  HttpError,
  setTimeToLive,
} from "../../utils/sessionHelpers";
import { validationSchema } from "../../utils/zodValidation";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
export async function POST(req: NextRequest) {
  try {
    console.log(req);

    const { email, rememberMe } = await req.json();

    const validateEmailAndRememberMe = validationSchema.pick({
      email: true,
      rememberMe: true,
    });
    validateEmailAndRememberMe.parse({ email, rememberMe });

    const ttl = setTimeToLive(rememberMe); // 1 week vs 15 minutes

    const userSessionToBeIssued = await getPrelimSession(email);

    if (!userSessionToBeIssued) {
      throw new HttpError("Session not found. Unauthorized access", 404);
    }
    if (!userSessionToBeIssued.secretToken) {
      throw new HttpError(
        "Session data is incomplete. Missing secret token.",
        500,
      );
    }
    const emailHash = crypto
      .createHmac("sha256", userSessionToBeIssued.secretToken)
      .update(userSessionToBeIssued.email)
      .digest("hex");

    const sessionData = await getSessionDataByHash(emailHash);
    if (sessionData.status !== "subscribed") {
      throw new HttpError("Unauthorized access", 401);
    }
    // Generate new session and CSRF tokens which we use to sent the cookie
    const { sessionToken, csrfToken } = generateToken();

    await createSession(sessionToken, { ...sessionData, csrfToken }, ttl);

    await createCookie("sessionToken", sessionToken, {
      maxAge: ttl,
      sameSite: "lax",
    });

    await createCookie("csrfToken", csrfToken, { maxAge: ttl });

    const response = new NextResponse(
      JSON.stringify({ message: "Session active", sessionToken }),
      {
        status: 200,
      },
    );

    return response;
  } catch (error) {
    console.error("Failed to process request:", error);

    if (error instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: error.status,
      });
    }
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
      },
    );
  }
}
