import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';
import crypto from 'crypto';

// Set required environment variables for testing
test.before.each(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_456';
});

// --- Fake Stripe Implementation ---
const fakeStripe = function StripeMock(secretKey) {
  return {
    webhooks: {
      constructEvent: (rawBody, sig, webhookSecret) => {
        // If signature is not "valid", simulate verification failure.
        if (sig !== "valid") {
          throw new Error("Signature verification failed");
        }
        // Otherwise, return a dummy event. We'll allow overriding event type via an option.
        const eventType = fakeStripe.eventType || "checkout.session.completed";
        return {
          id: "evt_test",
          type: eventType,
          data: {
            object: {
              id: eventType === "checkout.session.expired" ? "cs_expired_123" : "cs_completed_123",
              metadata: { sessionToken: "validSessionToken" },
              // For checkout.session.completed, include shipping details.
              shipping_details: eventType === "checkout.session.completed" ? {
                address: {
                  line1: "123 Main St",
                  line2: "",
                  city: "City",
                  state: "State",
                  postal_code: "12345",
                  country: "US"
                }
              } : undefined
            }
          }
        };
      }
    }
  };
};

// --- Fake Mailchimp Helpers ---
const fakeMailchimpHelpers = {
  updateMailchimpAddress: async (email, address) => {
    return "OK";
  },
  updateMailchimpTag: async (email, tag, status) => {
    return "OK";
  }
};

// --- Fake Session Helpers ---
const fakeSessionHelpers = {
  getSessionDataByToken: async (token) => {
    // Return a session with checkoutStatus 'pending' by default.
    return { csrfToken: "validCsrf", email: "test@example.com", rememberMe: false, checkoutStatus: "pending" };
  },
  updateSessionData: async (token, sessionData, ttl) => {
    // Simply resolve (simulate updating in redis)
    return;
  },
  HttpError: class FakeHttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
};

// --- Helper to import the webhook route with our overrides ---
async function importStripeWebhookRoute(overrides = {}) {
  return esmock('./route.js', {
    // Override the Stripe module with our fake.
    "stripe": fakeStripe,
    // Override Mailchimp helpers
    '../../../utils/mailchimpHelpers.js': { ...fakeMailchimpHelpers, ...overrides.mailchimpHelpers },
    // Override sessionHelpers
    '../../../utils/sessionHelpers.js': { ...fakeSessionHelpers, ...overrides.sessionHelpers },
    // No override for redis is needed unless your route uses it.
  });
}

/* =======================
   TESTS
======================= */

/** GET request returns live message */
test('GET returns live message', async () => {
  const moduleUnderTest = await importStripeWebhookRoute();
  const webhookGET = moduleUnderTest.GET;
  const response = webhookGET();
  assert.is(response.status, 200);
  const text = await response.text();
  assert.match(text, /webhook endpoint is live/i);
});

/** POST returns 401 if signature verification fails */
test('POST returns 401 when signature verification fails', async () => {
  // Use a signature other than "valid" to simulate failure.
  const moduleUnderTest = await importStripeWebhookRoute();
  const webhookPOST = moduleUnderTest.POST;
  
  // Construct a fake request with an invalid signature.
  const req = {
    arrayBuffer: async () => new ArrayBuffer(8), // dummy buffer
    headers: new Map([['stripe-signature', 'invalid']])
  };
  
  const response = await webhookPOST(req);
  assert.is(response.status, 401);
  const text = await response.text();
  assert.match(text, /Webhook Error: Signature verification failed/i);
});

/** POST returns 200 for checkout.session.completed event */
test('POST processes checkout.session.completed event successfully', async () => {
  // Set fakeStripe to return a "checkout.session.completed" event.
  fakeStripe.eventType = "checkout.session.completed";
  
  // Override getSessionDataByToken to return valid session data.
  const sessionHelpersOverride = {
    getSessionDataByToken: async (token) => ({
      csrfToken: "validCsrf",
      email: "test@example.com",
      rememberMe: false,
      checkoutStatus: "pending"
    })
  };
  
  const moduleUnderTest = await importStripeWebhookRoute({ sessionHelpers: sessionHelpersOverride });
  const webhookPOST = moduleUnderTest.POST;
  
  // Construct a fake request with valid signature.
  const req = {
    arrayBuffer: async () => {
      // Return a dummy ArrayBuffer. Its content isn't used by our fake.
      return new ArrayBuffer(8);
    },
    headers: new Map([['stripe-signature', 'valid']])
  };
  
  const response = await webhookPOST(req);
  assert.is(response.status, 200);
  
  const data = await response.json();
  // We expect a JSON response with { received: true }.
  assert.equal(data, { received: true });
});

/** POST returns 200 for checkout.session.expired event */
test('POST processes checkout.session.expired event successfully', async () => {
  // Set fakeStripe to return a "checkout.session.expired" event.
  fakeStripe.eventType = "checkout.session.expired";
  
  // For the expired event, simulate that session data is present and not already completed.
  const sessionHelpersOverride = {
    getSessionDataByToken: async (token) => ({
      csrfToken: "validCsrf",
      email: "test@example.com",
      rememberMe: false,
      checkoutStatus: "pending"
    })
  };
  
  const moduleUnderTest = await importStripeWebhookRoute({ sessionHelpers: sessionHelpersOverride });
  const webhookPOST = moduleUnderTest.POST;
  
  const req = {
    arrayBuffer: async () => new ArrayBuffer(8),
    headers: new Map([['stripe-signature', 'valid']])
  };
  
  const response = await webhookPOST(req);
  // For expired sessions, our handler updates the session status to "cancelled"
  // and (by design) does not throw an error – so we expect a 200 response.
  assert.is(response.status, 200);
  const data = await response.json();
  // In this test we don't simulate a specific JSON response from handleCheckoutSessionExpired,
  // but the main route returns { received: true } if processing succeeds.
  assert.equal(data, { received: true });
});

test.run();