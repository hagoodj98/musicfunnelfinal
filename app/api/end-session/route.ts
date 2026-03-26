import redis from "@/lib/redis";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    redis.del(`session:${sessionToken}`);
    cookieStore.delete("sessionToken");
    cookieStore.delete("csrfToken");

    return NextResponse.json(
      { message: "Session ended. Cookies cleared." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.error();
  }
}
