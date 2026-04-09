import { z } from "zod/v4";
import { isValidAddressSchema } from "../../utils/inputValidation";
import { NextRequest, NextResponse } from "next/server";
import { client, createLookup } from "@/app/utils/addressValidationClient";
import { handleValidateAddressRateLimit } from "@/app/utils/limiterhelpers";
import { cookies } from "next/headers";
import redis from "@/lib/redis";
import { HttpError } from "@/app/utils/errorhandler";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { line1, line2, city, state, postal_code } =
      await isValidAddressSchema.parseAsync(payload);

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    const csrfToken = cookieStore.get("csrfToken")?.value;

    // Apply rate limiting for address validation
    if (!sessionToken || !csrfToken) {
      await redis.del(`session:${sessionToken}`); // Delete session server-side to ensure the ban holds even if the client ignores the 401 and clears their own cookies.
      cookieStore.delete("sessionToken");
      cookieStore.delete("csrfToken");
      throw new HttpError(
        "Session token or CSRF token is required for address validation. Please ensure you have an active session.",
        401,
      );
    }
    try {
      // If the session token is present, we apply rate limiting to prevent abuse of the address validation endpoint. This helps protect against brute-force attempts to guess valid addresses and ensures that users can't repeatedly hit the endpoint without consequences. If the user exceeds the allowed number of attempts within the specified time frame, they will receive a 429 Too Many Requests response, and if they reach the maximum failures, their session will be closed with a 429 Too Many Requests response on subsequent attempts.
      await handleValidateAddressRateLimit(sessionToken); // The duration is irrelevant here because if users exceed the limit, they are probably scammers. So go ahead and delete their session and make them start over. This will make it more time consuming for scammers to brute-force addresses, while still allowing legitimate users to try again after an hour if they make a mistake in entering their address.
    } catch (error) {
      console.error("Rate limit error for address validation:", error);
      // Delete session server-side so the ban holds even if the client ignores the 429 and clears their own cookies.
      await redis.del(`session:${sessionToken}`);
      cookieStore.delete("sessionToken");
      cookieStore.delete("csrfToken");
      throw new HttpError(
        `Too many attempts for validating address. Your session is closed. Try again later.`,
        429,
      );
    }

    // Build a fresh Smarty lookup for this request
    const lookup = createLookup();
    lookup.street = line1;
    if (line2) lookup.street2 = line2;
    lookup.city = city;
    lookup.state = state;
    lookup.zipCode = postal_code;
    // We only care if there's at least one deliverable match, so limit to 1 candidate for efficiency. This tells Smarty to stop searching for more candidates after it finds the first one, which can improve performance since we only need to know if the address is deliverable or not.
    lookup.maxCandidates = 1;
    // This tells Smarty to only return candidates that are confirmed deliverable, filtering out undeliverable addresses right away.
    lookup.match = "strict";

    await client.send(lookup); // Send the lookup request to Smarty's API
    // If Smarty returns at least one candidate, the address is deliverable. If it returns zero candidates, it's undeliverable.
    const isDeliverable = (lookup.result ?? []).length > 0;
    if (!isDeliverable) {
      // If the address is undeliverable, we return a 422 Unprocessable Entity response with an appropriate error message. This indicates to the client that the provided address is not valid for shipping.
      throw new HttpError(
        "The provided shipping address is undeliverable.",
        422,
      );
    }

    return NextResponse.json(
      { message: "Address is deliverable and valid!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Address validation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid shipping address format" },
        { status: 400 },
      );
    }
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Error validating shipping address" },
      { status: 500 },
    );
  }
}
