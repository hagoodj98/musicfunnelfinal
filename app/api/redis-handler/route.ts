import { NextRequest, NextResponse } from "next/server";
import redis from "../../../lib/redis";
import { HttpError } from "@/app/utils/errorhandler";

export async function POST(req: NextRequest) {
  const { action, key } = await req.json();
  try {
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
    return new NextResponse(JSON.stringify({ result }), { status: 200 });
  } catch (error: unknown) {
    console.error("Redis Handler Error:", error);
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
