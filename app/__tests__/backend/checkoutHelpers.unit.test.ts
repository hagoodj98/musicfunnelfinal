import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Stripe } from "stripe";
import { HttpError } from "../../utils/errorhandler";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../utils/sessionHelpers", () => ({
  updateCheckoutSessionData: vi.fn(),
}));

import { processSuccessfulCheckout } from "../../utils/checkoutHelpers";
import { updateCheckoutSessionData } from "../../utils/sessionHelpers";

const mockUpdateCheckoutSessionData = vi.mocked(updateCheckoutSessionData);

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Build a minimal Stripe.Checkout.Session with the given metadata and optional shipping */
function makePaymentIntent(opts: {
  sessionToken?: string;
}): Stripe.Checkout.Session {
  const { sessionToken } = opts;
  return {
    metadata: sessionToken ? { sessionToken } : null,
    collected_information: null,
  } as unknown as Stripe.Checkout.Session;
}

// ─── processSuccessfulCheckout ─────────────────────────────────────────────

describe("processSuccessfulCheckout", () => {
  beforeEach(() => {
    mockUpdateCheckoutSessionData.mockReset();
    mockUpdateCheckoutSessionData.mockResolvedValue(undefined);
  });

  it("throws HttpError 400 when metadata is null", async () => {
    const pi = makePaymentIntent({});
    await expect(processSuccessfulCheckout(pi)).rejects.toMatchObject({
      status: 400,
    });
    await expect(processSuccessfulCheckout(pi)).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it("throws HttpError 400 when sessionToken is missing from metadata", async () => {
    const pi = {
      metadata: {},
      collected_information: null,
    } as unknown as Stripe.Checkout.Session;
    await expect(processSuccessfulCheckout(pi)).rejects.toMatchObject({
      status: 400,
    });
  });

  it("calls updateCheckoutSessionData with the sessionToken from metadata", async () => {
    const pi = makePaymentIntent({ sessionToken: "tok123" });
    await processSuccessfulCheckout(pi);
    expect(mockUpdateCheckoutSessionData).toHaveBeenCalledWith("tok123", pi);
  });

  it("propagates underlying helper errors", async () => {
    mockUpdateCheckoutSessionData.mockRejectedValue(
      new HttpError("update failed", 500),
    );
    const pi = makePaymentIntent({ sessionToken: "tok123" });

    await expect(processSuccessfulCheckout(pi)).rejects.toMatchObject({
      status: 500,
      message: "update failed",
    });
  });
});
