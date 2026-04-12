import { NextRequest, NextResponse } from "next/server";
import redis from "../../../lib/redis";
import { HttpError } from "@/app/utils/errorhandler";

export async function POST(req: NextRequest) {
  const { action, key } = await req.json();
  try {
    // Only requests from within the app (e.g. middleware) are allowed.
    // The secret is a non-public env var and never reaches the browser.
    const internalSecret = req.headers.get("x-internal-secret");
    if (!internalSecret || internalSecret !== process.env.INTERNAL_API_SECRET) {
      throw new HttpError("Unauthorized.", 401);
    }

    let result = null;
    switch (action) {
      case "get":
        result = await redis.get(key);
        break;
      case "set":
        const { value } = await req.json();
        result = await redis.set(key, value);
        break;
      default:
        throw new HttpError("Unsupported action", 400);
    }
    return NextResponse.json({ result }, { status: 200 });
  } catch (error: unknown) {
    console.error("Redis Handler Error:", error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: (error as Error).message },
      {
        status: 500,
      },
    );
  }
}
