import redis from "../../../lib/redis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { HttpError } from "@/app/utils/errorhandler";

export async function GET() {
  try {
    //Retrieve cookies from the request
    const cookieStore = await cookies();
    //get name of the cookie that we want to retrieve and its value
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      throw new HttpError("Session token not found", 404);
    }

    const ttl = await redis.ttl(`session:${sessionToken}`);

    if (ttl === -2) {
      throw new HttpError("Session not found or expired", 404);
    }
    //Return the TTL value. We use this value to set our timer on the client side to know when session is going to expire
    return new Response(JSON.stringify({ ttl }), { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
      });
    }
    return new NextResponse(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 },
    );
  }
}
