import { cookies } from "next/headers";
import {
  generateToken,
  getSessionDataByToken,
  HttpError,
  updateSessionData,
  setTimeToLive,
  createCookie,
} from "../../utils/sessionHelpers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    //Get current cookies (sessionToken and CSRF)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value; //It always good to get the value safely
    const csrfTokenFromCookie = cookieStore.get("csrfToken")?.value;

    if (!sessionToken) {
      throw new HttpError("Session token is required", 400);
    }
    if (!csrfTokenFromCookie) {
      throw new HttpError("CSRF token is required", 400);
    }
    // Retrieve current session data. The way to get the current session is by using the getSessionDataByToken
    const currentSessionData = await getSessionDataByToken(sessionToken);

    if (csrfTokenFromCookie !== currentSessionData.csrfToken) {
      throw new HttpError("Invalid CSRF token. Unauthorized!", 403);
    }
    if (currentSessionData.rememberMe === undefined) {
      throw new HttpError(
        "Session data is incomplete. Missing rememberMe property.",
        500,
      );
    }
    const ttl = setTimeToLive(currentSessionData.rememberMe); // 1 week vs 15 minutes

    const { sessionToken: newSessionToken, csrfToken: newCsrfToken } =
      generateToken();

    // Copy the current session data and update tokens accordingly
    const updatedSessionData = {
      ...currentSessionData,
      csrfToken: newCsrfToken,
    };

    await updateSessionData(newSessionToken, updatedSessionData, ttl);

    await createCookie("sessionToken", newSessionToken, {
      maxAge: ttl,
      sameSite: "strict",
    });
    await createCookie("csrfToken", newCsrfToken, {
      maxAge: ttl,
      sameSite: "strict",
    });
    return new NextResponse(
      JSON.stringify({
        message: "Session and cookies are refreshed with new ones ",
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error refreshing session:", error);
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
