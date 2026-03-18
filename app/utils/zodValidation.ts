import z from "zod/v4";

export const validationSchema = z.object({
  name: z
    .string()
    .trim() // Remove leading/trailing whitespace early
    .min(2, { message: "Name is required" })
    .max(50, { message: "Name must be 50 characters or fewer" })
    .regex(/^[A-Za-z\s'-]+$/, {
      message:
        "Name may only contain letters, spaces, apostrophes, and hyphens.",
    }),
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.email({ message: "Invalid email address" }),
  ),
  rememberMe: z.boolean().optional(),
});
