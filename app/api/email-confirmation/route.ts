import {
  createCookie,
  createSession,
  generateToken,
  getSessionDataByHash,
  HttpError,
} from "@/app/utils/sessionHelpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log(req.nextUrl.searchParams.get("email"));
  const emailHash = req.nextUrl.searchParams.get("email");
  if (!emailHash) {
    throw new HttpError("Session not found. Unauthorized access", 404);
  }
  const userSessionToBeIssued = await getSessionDataByHash(emailHash);
  if (!userSessionToBeIssued.ttl) {
    throw new HttpError("Unauthorized access", 401);
  }
  const ttl = userSessionToBeIssued.ttl;

  if (userSessionToBeIssued.status !== "subscribed") {
    throw new HttpError("Unauthorized access", 401);
  }
  const { sessionToken, csrfToken } = generateToken();

  await createSession(
    sessionToken,
    { ...userSessionToBeIssued, csrfToken },
    ttl,
  );

  await createCookie("sessionToken", sessionToken, { maxAge: ttl });
  await createCookie("csrfToken", csrfToken, { maxAge: ttl });

  const res = NextResponse.redirect(new URL("/landing", req.url));

  return res;
}
