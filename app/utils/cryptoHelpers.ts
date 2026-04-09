import crypto from "crypto";

export function computeEmailHash(salt: string, email: string): string {
  return crypto
    .createHmac("sha256", salt)
    .update(email.toLocaleLowerCase())
    .digest("hex");
}
