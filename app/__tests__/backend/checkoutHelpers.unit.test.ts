import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Stripe } from "stripe";
import { HttpError } from "../../utils/errorhandler";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../utils/mailchimpHelpers", () => ({
  updateMailchimpAddress: vi.fn(),
  updateMailchimpTag: vi.fn(),
}));

vi.mock("../../utils/sessionHelpers", () => ({
  getSessionDataByToken: vi.fn(),
  updateSessionData: vi.fn(),
  setTimeToLive: vi.fn().mockReturnValue(900),
}));

import { handleCheckoutSessionCompleted } from "../../utils/checkoutHelpers";
import {
  updateMailchimpAddress,
  updateMailchimpTag,
} from "../../utils/mailchimpHelpers";
import {
  getSessionDataByToken,
  updateSessionData,
  setTimeToLive,
} from "../../utils/sessionHelpers";
import type { UserSession } from "../../types/types";

const mockGetSession = vi.mocked(getSessionDataByToken);
const mockUpdateSession = vi.mocked(updateSessionData);
const mockSetTTL = vi.mocked(setTimeToLive);
const mockUpdateAddress = vi.mocked(updateMailchimpAddress);
const mockUpdateTag = vi.mocked(updateMailchimpTag);

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeSession = (overrides: Partial<UserSession> = {}): UserSession => ({
  email: "user@example.com",
  name: "Test User",
  status: "subscribed",
  rememberMe: false,
  checkoutStatus: "active",
  ...overrides,
});

/** Build a minimal Stripe.Checkout.Session with the given metadata and optional shipping */
function makePaymentIntent(opts: {
  sessionToken?: string;
  withShipping?: boolean;
}): Stripe.Checkout.Session {
  const { sessionToken, withShipping = false } = opts;
  return {
    metadata: sessionToken ? { sessionToken } : null,
    collected_information: withShipping
      ? {
          shipping_details: {
            address: {
              line1: "123 Main St",
              line2: null,
              city: "Springfield",
              state: "IL",
              postal_code: "62701",
              country: "US",
            },
          },
        }
      : null,
  } as unknown as Stripe.Checkout.Session;
}

// ─── handleCheckoutSessionCompleted ─────────────────────────────────────────────

describe("handleCheckoutSessionCompleted", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockUpdateSession.mockReset();
    mockSetTTL.mockReset();
    mockUpdateAddress.mockReset();
    mockUpdateTag.mockReset();
    mockSetTTL.mockReturnValue(600);
    mockUpdateSession.mockResolvedValue(undefined);
    mockUpdateAddress.mockResolvedValue({} as never);
    mockUpdateTag.mockResolvedValue({} as never);
  });

  it("throws HttpError 400 when metadata is null", async () => {
    const pi = makePaymentIntent({});
    await expect(handleCheckoutSessionCompleted(pi)).rejects.toMatchObject({
      status: 400,
    });
    await expect(handleCheckoutSessionCompleted(pi)).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it("throws HttpError 400 when sessionToken is missing from metadata", async () => {
    const pi = {
      metadata: {},
      collected_information: null,
    } as unknown as Stripe.Checkout.Session;
    await expect(handleCheckoutSessionCompleted(pi)).rejects.toMatchObject({
      status: 400,
    });
  });

  it("retrieves session data using the sessionToken from metadata", async () => {
    mockGetSession.mockResolvedValue(makeSession());
    const pi = makePaymentIntent({ sessionToken: "tok123" });
    await handleCheckoutSessionCompleted(pi);
    expect(mockGetSession).toHaveBeenCalledWith("tok123");
  });

  it("throws HttpError 500 when session is missing rememberMe", async () => {
    const session = makeSession();
    delete (session as Partial<typeof session>).rememberMe;
    mockGetSession.mockResolvedValue(session);
    const pi = makePaymentIntent({ sessionToken: "tok123" });
    await expect(handleCheckoutSessionCompleted(pi)).rejects.toMatchObject({
      status: 500,
    });
  });

  it("marks checkoutStatus as 'completed' before persisting", async () => {
    const session = makeSession({ rememberMe: false });
    mockGetSession.mockResolvedValue(session);
    const pi = makePaymentIntent({ sessionToken: "tok123" });
    await handleCheckoutSessionCompleted(pi);
    expect(mockUpdateSession).toHaveBeenCalledWith(
      "tok123",
      expect.objectContaining({ checkoutStatus: "completed" }),
      expect.any(Number),
    );
  });

  it("persists the session with the TTL returned by setTimeToLive", async () => {
    mockSetTTL.mockReturnValue(604800);
    const session = makeSession({ rememberMe: true });
    mockGetSession.mockResolvedValue(session);
    const pi = makePaymentIntent({ sessionToken: "tok123" });
    await handleCheckoutSessionCompleted(pi);
    expect(mockSetTTL).toHaveBeenCalledWith(true);
    expect(mockUpdateSession).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      604800,
    );
  });

  it("does NOT call Mailchimp helpers when shipping details are absent", async () => {
    const session = makeSession();
    mockGetSession.mockResolvedValue(session);
    const pi = makePaymentIntent({
      sessionToken: "tok123",
      withShipping: false,
    });
    await handleCheckoutSessionCompleted(pi);
    expect(mockUpdateAddress).not.toHaveBeenCalled();
    expect(mockUpdateTag).not.toHaveBeenCalled();
  });

  it("calls updateMailchimpAddress with the session email and formatted address when shipping is present", async () => {
    const session = makeSession({ email: "buyer@example.com" });
    mockGetSession.mockResolvedValue(session);
    const pi = makePaymentIntent({
      sessionToken: "tok123",
      withShipping: true,
    });
    await handleCheckoutSessionCompleted(pi);
    expect(mockUpdateAddress).toHaveBeenCalledWith("buyer@example.com", {
      addr1: "123 Main St",
      addr2: "",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      country: "US",
    });
  });

  it("calls updateMailchimpTag with 'Fan Purchaser' and 'active' when shipping is present", async () => {
    const session = makeSession({ email: "buyer@example.com" });
    mockGetSession.mockResolvedValue(session);
    const pi = makePaymentIntent({
      sessionToken: "tok123",
      withShipping: true,
    });
    await handleCheckoutSessionCompleted(pi);
    expect(mockUpdateTag).toHaveBeenCalledWith(
      "buyer@example.com",
      "Fan Purchaser",
      "active",
    );
  });
});
