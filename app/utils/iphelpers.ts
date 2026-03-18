import { NextRequest } from "next/server";
import crypto from "crypto";

export const getClientIp = (req: NextRequest): string => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  //Every time traffic passes through another proxy, that proxy appends its own address to the far right.
  //So we always grab the first value to get the real client.
  const ipFromForwardedHeader = forwardedFor?.split(",")[0]?.trim();
  const ipAddress = ipFromForwardedHeader || realIp || "unknown-ip";
  const ipAddressWithHash = crypto
    .createHash("sha256")
    .update(ipAddress + process.env.IP_HASH_SALT) // Combine IP with a server-side salt for added security
    .digest("hex");
  return ipAddressWithHash;
};
