import { NextRequest, NextResponse } from "next/server";
import {
  createCookie,
  createSession,
  generateToken,
  HttpError,
} from "../../../utils/sessionHelpers";
import { UserSession } from "../../../types/types";

export async function GET(req: NextRequest) {
  try {
    // Never expose debug session bootstrapping outside local development.
    if (process.env.NODE_ENV !== "development") {
      return new NextResponse("Not Found", { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const email = (
      searchParams.get("email") || "debug@local.test"
    ).toLowerCase();
    const name = searchParams.get("name") || "Debug User";
    const rememberMe = searchParams.get("rememberMe") !== "false";
    const target = searchParams.get("target") || "/landing";
    const ttl = rememberMe ? 80 : 90;
    //604800 : 90;
    const { sessionToken, csrfToken, secretSaltToken } = generateToken();

    const sessionData: UserSession = {
      email,
      name,
      status: "subscribed",
      rememberMe,
      ttl,
      secretToken: secretSaltToken,
      csrfToken,
    };

    await createSession(sessionToken, sessionData, ttl);

    await createCookie("sessionToken", sessionToken, {
      maxAge: ttl,
      sameSite: "lax",
    });

    await createCookie("csrfToken", csrfToken, {
      maxAge: ttl,
      sameSite: "lax",
    });

    return NextResponse.redirect(new URL(target, req.url));
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: error.status,
      });
    }

    return new NextResponse(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 },
    );
  }
}
