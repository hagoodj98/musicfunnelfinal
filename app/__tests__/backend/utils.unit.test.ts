import { describe, it, expect } from "vitest";
import { HttpError } from "../../utils/errorhandler";
import { computeEmailHash } from "../../utils/cryptoHelpers";
import {
  isDisposableEmailDomain,
  isObviousJunkEmail,
  isObviousJunkName,
  validationSchema,
  isValidAddressSchema,
} from "../../utils/inputValidation";

// ─── HttpError ───────────────────────────────────────────────────────────────

describe("HttpError", () => {
  it("is an instance of Error", () => {
    expect(new HttpError("bad request", 400)).toBeInstanceOf(Error);
  });

  it("exposes the provided HTTP status code", () => {
    expect(new HttpError("not found", 404).status).toBe(404);
    expect(new HttpError("server error", 500).status).toBe(500);
  });

  it("exposes the provided message", () => {
    expect(new HttpError("something failed", 400).message).toBe(
      "something failed",
    );
  });
});

// ─── computeEmailHash ────────────────────────────────────────────────────────

describe("computeEmailHash", () => {
  it("returns a 64-char lowercase hex string (HMAC-SHA256)", () => {
    const result = computeEmailHash("mysalt", "user@example.com");
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same salt and email", () => {
    const a = computeEmailHash("salt", "user@example.com");
    const b = computeEmailHash("salt", "user@example.com");
    expect(a).toBe(b);
  });

  it("normalises the email to lowercase before hashing", () => {
    const lower = computeEmailHash("s", "user@example.com");
    const mixed = computeEmailHash("s", "User@EXAMPLE.COM");
    expect(lower).toBe(mixed);
  });

  it("produces different outputs for different salts", () => {
    expect(computeEmailHash("saltA", "a@b.com")).not.toBe(
      computeEmailHash("saltB", "a@b.com"),
    );
  });

  it("produces different outputs for different emails", () => {
    expect(computeEmailHash("s", "a@b.com")).not.toBe(
      computeEmailHash("s", "c@d.com"),
    );
  });
});

// ─── isDisposableEmailDomain ─────────────────────────────────────────────────

describe("isDisposableEmailDomain", () => {
  it("flags well-known disposable domains", () => {
    expect(isDisposableEmailDomain("user@mailinator.com")).toBe(true);
    expect(isDisposableEmailDomain("x@guerrillamail.com")).toBe(true);
    expect(isDisposableEmailDomain("x@yopmail.com")).toBe(true);
  });

  it("allows legitimate domains", () => {
    expect(isDisposableEmailDomain("user@gmail.com")).toBe(false);
    expect(isDisposableEmailDomain("user@company.org")).toBe(false);
    expect(isDisposableEmailDomain("user@outlook.com")).toBe(false);
  });

  it("flags subdomains of known disposable domains", () => {
    expect(isDisposableEmailDomain("user@sub.mailinator.com")).toBe(true);
  });

  it("returns false when the local part has no @ domain", () => {
    expect(isDisposableEmailDomain("nodomain")).toBe(false);
  });
});

// ─── isObviousJunkEmail ──────────────────────────────────────────────────────

describe("isObviousJunkEmail", () => {
  it("blocks emails containing junk keywords", () => {
    expect(isObviousJunkEmail("test@example.com")).toBe(true);
    expect(isObviousJunkEmail("fake@anything.com")).toBe(true);
    expect(isObviousJunkEmail("invalid@domain.com")).toBe(true);
  });

  it("blocks emails with long repeated characters", () => {
    expect(isObviousJunkEmail("aaaaaaaaaa@email.com")).toBe(true);
    expect(isObviousJunkEmail("11111@email.com")).toBe(true);
  });

  it("allows normal-looking emails", () => {
    expect(isObviousJunkEmail("sarah@company.com")).toBe(false);
    expect(isObviousJunkEmail("john.smith@email.com")).toBe(false);
  });
});

// ─── isObviousJunkName ───────────────────────────────────────────────────────

describe("isObviousJunkName", () => {
  it("blocks known placeholder names", () => {
    expect(isObviousJunkName("John Doe")).toBe(true);
    expect(isObviousJunkName("Jane Doe")).toBe(true);
    expect(isObviousJunkName("Anonymous")).toBe(true);
    expect(isObviousJunkName("unknown")).toBe(true);
    expect(isObviousJunkName("Test User")).toBe(true);
  });

  it("blocks names with long repeated characters", () => {
    expect(isObviousJunkName("aaaaaaaa")).toBe(true);
  });

  it("allows real-looking names", () => {
    expect(isObviousJunkName("Sarah Johnson")).toBe(false);
    expect(isObviousJunkName("Michael Chen")).toBe(false);
    expect(isObviousJunkName("Priya Nair")).toBe(false);
  });
});

// ─── validationSchema ────────────────────────────────────────────────────────

describe("validationSchema", () => {
  it("accepts a valid name, email, and optional rememberMe", async () => {
    const result = await validationSchema.parseAsync({
      name: "Sarah Johnson",
      email: "sarah@company.com",
      rememberMe: true,
    });
    expect(result.email).toBe("sarah@company.com");
    expect(result.name).toBe("Sarah Johnson");
    expect(result.rememberMe).toBe(true);
  });

  it("normalises email to lowercase and trims whitespace", async () => {
    const { email } = await validationSchema.parseAsync({
      name: "Sarah Johnson",
      email: "  Sarah@COMPANY.COM  ",
    });
    expect(email).toBe("sarah@company.com");
  });

  it("rejects an invalid email address", async () => {
    await expect(
      validationSchema.parseAsync({
        name: "Sarah Johnson",
        email: "notanemail",
      }),
    ).rejects.toThrow();
  });

  it("rejects a name that is too short", async () => {
    await expect(
      validationSchema.parseAsync({ name: "A", email: "a@b.com" }),
    ).rejects.toThrow();
  });

  it("rejects a name with numeric characters", async () => {
    await expect(
      validationSchema.parseAsync({ name: "Name123", email: "a@b.com" }),
    ).rejects.toThrow();
  });

  it("rejects a name longer than 50 characters", async () => {
    await expect(
      validationSchema.parseAsync({
        name: "A".repeat(51),
        email: "a@b.com",
      }),
    ).rejects.toThrow();
  });
});

// ─── isValidAddressSchema ────────────────────────────────────────────────────

describe("isValidAddressSchema", () => {
  it("accepts a complete valid address", async () => {
    const result = await isValidAddressSchema.parseAsync({
      line1: "123 Main St",
      city: "Springfield",
      state: "IL",
      postal_code: "62701",
    });
    expect(result.line1).toBe("123 Main St");
    expect(result.city).toBe("Springfield");
  });

  it("accepts an optional line2", async () => {
    const result = await isValidAddressSchema.parseAsync({
      line1: "123 Main St",
      line2: "Apt 4B",
      city: "Springfield",
      state: "IL",
      postal_code: "62701",
    });
    expect(result.line2).toBe("Apt 4B");
  });

  it("rejects a missing city", async () => {
    await expect(
      isValidAddressSchema.parseAsync({
        line1: "123 Main St",
        state: "IL",
        postal_code: "62701",
      }),
    ).rejects.toThrow();
  });

  it("rejects an empty required field", async () => {
    await expect(
      isValidAddressSchema.parseAsync({
        line1: "",
        city: "Springfield",
        state: "IL",
        postal_code: "62701",
      }),
    ).rejects.toThrow();
  });
});
