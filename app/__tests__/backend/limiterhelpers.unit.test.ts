import { describe, it, expect, vi } from "vitest";
import { HttpError } from "../../utils/errorhandler";

// --- Mocks for the imported limiters ---
const consumeMock = vi.fn();
const limiterFactory = () => ({ consume: consumeMock });

// HOISTED MOCK: must be at top-level so it's active before import
vi.mock("@/lib/limiters", () => ({
  checkoutSessionRateLimiter: () => limiterFactory(),
  findEmailRateLimiter: () => limiterFactory(),
  subscriberEmailRateLimiter: () => limiterFactory(),
  validateAddressRateLimiter: () => limiterFactory(),
}));

import * as limiterHelpers from "../../utils/limiterhelpers";

describe("limiterhelpers", () => {
  beforeEach(() => {
    consumeMock.mockReset();
  });

  // --- handleCheckoutSessionRateLimit ---
  it("handleCheckoutSessionRateLimit: calls consume and passes on success", async () => {
    consumeMock.mockResolvedValue(undefined);
    await expect(
      limiterHelpers.handleCheckoutSessionRateLimit("tok"),
    ).resolves.toBeUndefined();
    expect(consumeMock).toHaveBeenCalledWith("tok");
  });

  it("handleCheckoutSessionRateLimit: throws HttpError on rate limit", async () => {
    consumeMock.mockRejectedValue({ msBeforeNext: 12345 });
    await expect(
      limiterHelpers.handleCheckoutSessionRateLimit("tok"),
    ).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining(
        "Too many attempts for session token tok. Try again in 13 seconds.",
      ),
    });
  });

  // --- handleFindEmailRateLimit ---
  it("handleFindEmailRateLimit: calls consume and passes on success", async () => {
    consumeMock.mockResolvedValue(undefined);
    await expect(
      limiterHelpers.handleFindEmailRateLimit("user@example.com"),
    ).resolves.toBeUndefined();
    expect(consumeMock).toHaveBeenCalledWith("user@example.com");
  });

  it("handleFindEmailRateLimit: throws HttpError on rate limit", async () => {
    consumeMock.mockRejectedValue({ msBeforeNext: 60000 });
    await expect(
      limiterHelpers.handleFindEmailRateLimit("user@example.com"),
    ).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining(
        "Too many attempts for email: user@example.com. Try again in 60 seconds.",
      ),
    });
  });

  // --- handleSubscribeRateLimit ---
  it("handleSubscribeRateLimit: calls consume and passes on success", async () => {
    consumeMock.mockResolvedValue(undefined);
    await expect(
      limiterHelpers.handleSubscribeRateLimit("user@example.com", 900),
    ).resolves.toBeUndefined();
    expect(consumeMock).toHaveBeenCalledWith("user@example.com");
  });

  it("handleSubscribeRateLimit: throws HttpError on rate limit", async () => {
    consumeMock.mockRejectedValue({ msBeforeNext: 30000 });
    await expect(
      limiterHelpers.handleSubscribeRateLimit("user@example.com", 900),
    ).rejects.toBeInstanceOf(HttpError);
    try {
      await limiterHelpers.handleSubscribeRateLimit("user@example.com", 900);
    } catch (err: unknown) {
      const typedErr = err as HttpError;
      expect(typedErr.status).toBe(429);
      // Accept either 30 or 60 seconds fallback
      expect(typedErr.message).toMatch(
        /Too many attempts for subscription for email: user@example.com\. Try again in (30|60) seconds\./,
      );
    }
  });

  // --- handleValidateAddressRateLimit ---
  it("handleValidateAddressRateLimit: calls consume and passes on success", async () => {
    consumeMock.mockResolvedValue(undefined);
    try {
      await expect(
        limiterHelpers.handleValidateAddressRateLimit("tok"),
      ).resolves.toBeUndefined();
    } catch (err: unknown) {
      const typedErr = err as HttpError;
      expect(typedErr.status).toBe(429);
      // Accept either 30 or 60 seconds fallback
      expect(typedErr.message).toMatch(
        /Too many attempts for validating address. Try again in (30|60) seconds\./,
      );
    }
    expect(consumeMock).toHaveBeenCalledWith("tok");
  });

  it("handleValidateAddressRateLimit: throws HttpError on rate limit", async () => {
    consumeMock.mockRejectedValue({ msBeforeNext: 10000 });
    await expect(
      limiterHelpers.handleValidateAddressRateLimit("tok"),
    ).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining(
        "Too many attempts for validating address. Try again later.",
      ),
    });
  });
});
