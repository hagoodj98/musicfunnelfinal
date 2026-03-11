import z from "zod/v4";

export const validationSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name is required" })
    .regex(/^[a-zA-Z\s]+$/, {
      message:
        "Name can only contain letters and spaces. Please remove any special characters or numbers!",
    }),
  email: z.email({ message: "Invalid email address" }),
  rememberMe: z.boolean().optional(),
});
