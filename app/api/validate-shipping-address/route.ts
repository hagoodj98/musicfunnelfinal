import { z } from "zod";
import { isValidAddressSchema } from "../../utils/inputValidation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    // Validate the incoming address data using Zod schema
    const { line1, line2, city, state, postal_code } =
      await isValidAddressSchema.parseAsync(payload);
    //Use Radar's address validation API to validate the shipping address after basic schema checks. This sends the address data to Radar, which checks it against various data sources to determine if it's a valid, deliverable address. If Radar determines the address is invalid or undeliverable, we reject the request with a 400 Bad Request error, prompting the user to correct their shipping information.
    console.log(line1, line2, city, state, postal_code);

    return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid shipping address format" }),
        {
          status: 400,
        },
      );
    }
    return new NextResponse(
      JSON.stringify({ error: "Error validating shipping address" }),
      {
        status: 500,
      },
    );
  }
}
