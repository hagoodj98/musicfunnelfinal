import z from "zod/v4";
import disposableDomains from "disposable-domains";
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

const disposableDomainSet = new Set(
  (disposableDomains as string[]).map((domain) => domain.toLowerCase()),
);

export const isDisposableEmailDomain = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  // Match exact domains and subdomains like sub.mailinator.com
  return Array.from(disposableDomainSet).some(
    (blockedDomain) =>
      domain === blockedDomain || domain.endsWith(`.${blockedDomain}`),
  );
};

//helper function to block out obvious junk patterns - not currently in use but can be added to the subscribe flow if needed
export const isObviousJunkEmail = (email: string): boolean => {
  const junkPatterns = [
    // Add more patterns as needed
    /test/i,
    /example/i,
    /fake/i,
    /invalid/i,
    /mailinator\.com/i, // common disposable email domain
    /tempmail/i,
    /10minutemail/i,
    /dispostable/i,
    /guerrillamail/i,
    /maildrop/i,
    /trashmail/i,
    /yopmail/i,
    /qwerty/i,
    /asdf/i,
    /zxcv/i,
    /12345/i,
    //any repeated characters (e.g. aaaaaa, 111111, etc.)
    /(.)\1{4,}/i, // This regex matches any character (.) that is repeated at least 5 times in a row (\1{4,}). You can adjust the number to be more or less strict.
  ];

  return junkPatterns.some((pattern) => pattern.test(email));
};
//helper function to block out obvious name patterns - not currently in use but can be added to the subscribe flow if needed
export const isObviousJunkName = (name: string): boolean => {
  const junkPatterns = [
    /test/i,
    /example/i,
    /fake/i,
    /invalid/i,
    /asdf/i,
    /qwerty/i,
    /zxcv/i,
    /12345/i,
    /john doe/i,
    /jane doe/i,
    /user/i,
    /anonymous/i,
    /null/i,
    /undefined/i,
    /no name/i,
    /nobody/i,
    /unknown/i,
    /abc/i,
    /xyz/i,
    /foo/i,
    /bar/i,

    /baz/i,
    /lorem/i,
    /ipsum/i,
    /dolor/i,
    //any repeated characters (e.g. aaaaaa, 111111, etc.)
    /(.)\1{4,}/i, // This regex matches any character (.) that is repeated at least 5 times in a row (\1{4,}). You can adjust the number to be more or less strict.
  ];

  return junkPatterns.some((pattern) => pattern.test(name));
};
