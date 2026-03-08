import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';
import crypto from 'crypto';

test.before.each(() => {
  process.env.STRIPE_PRICE_ID = 'price_123';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
});

// --- Fake Dependencies for create-checkout-session ---

let fakeSessionHelpers = {
  getSessionDataByToken: async (token) => ({
    csrfToken: 'validCsrf',
    email: 'test@example.com',
    checkoutStatus: 'initiated',
    rememberMe: false,
  }),
  updateSessionData: async () => {},
  createCookie: (name, value, options) => `${name}=${value}; Max-Age=${options.maxAge}; SameSite=${options.sameSite || 'lax'}`,
  HttpError: class HttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
};

let fakeRedis = {
  get: async () => null,
  incr: async () => 1,
  expire: async () => {},
};

const fakeStripe = function StripeMock(secretKey) {
  return {
    checkout: {
      sessions: {
        create: async (params) => {
          return { id: 'cs_test_12345', payment_status: 'unpaid' };
        },
        retrieve: async (sessionId) => {
          return { id: sessionId, payment_status: 'paid' };
        }
      }
    },
    paymentLinks: {
      create: async (obj) => {
        return { url: 'http://dummy.link' };
      }
    }
  };
};

async function importCreateCheckoutSession(overrides = {}) {
  return esmock('./route.js', {
    '../../utils/sessionHelpers.js': { ...fakeSessionHelpers, ...overrides.sessionHelpers },
    '../../utils/redis.js': { ...fakeRedis, ...overrides.redis },
    // Override local headers wrapper.
    './headersWrapper.js': {
      __esModule: true,
      cookies: overrides.cookies || async function defaultFakeCookies() {
        return {
          get: (name) => {
            if (name === 'sessionToken') return { value: 'validSessionToken' };
            if (name === 'csrfToken') return { value: 'validCsrf' };
            return undefined;
          }
        };
      }
    },
    stripe: fakeStripe
  });
}

/* =======================
   TESTS for create-checkout-session
======================= */

/** Test: Missing session token => 401 */
test('returns 401 if session token is missing', async () => {
  const missingSessionCookies = async () => ({
    get: (name) => {
      if (name === 'csrfToken') return { value: 'validCsrf' };
      return undefined;
    }
  });
  const { POST: createCheckoutSession } = await importCreateCheckoutSession({ cookies: missingSessionCookies });
  const req = { json: async () => ({ checkoutSessionId: 'cs_test_12345' }) };
  const response = await createCheckoutSession(req);
  assert.is(response.status, 401);
  const data = await response.json();
  assert.match(data.error, /Session token is required/i);
});

/** Test: Missing CSRF token => 401 */
test('returns 401 if CSRF token is missing', async () => {
  const missingCsrfCookies = async () => ({
    get: (name) => {
      if (name === 'sessionToken') return { value: 'validSessionToken' };
      return undefined;
    }
  });
  const { POST: createCheckoutSession } = await importCreateCheckoutSession({ cookies: missingCsrfCookies });
  const req = { json: async () => ({ checkoutSessionId: 'cs_test_12345' }) };
  const response = await createCheckoutSession(req);
  assert.is(response.status, 401);
  const data = await response.json();
  assert.match(data.error, /CSRF token is required/i);
});

/** Test: Invalid CSRF token => 403 */
test('returns 403 if CSRF token does not match session data', async () => {
  const sessionHelpersOverride = {
    getSessionDataByToken: async () => ({
      csrfToken: 'differentCsrf',
      email: 'test@example.com',
      checkoutStatus: 'initiated',
      rememberMe: false,
    })
  };
  const { POST: createCheckoutSession } = await importCreateCheckoutSession({ sessionHelpers: sessionHelpersOverride });
  const req = { json: async () => ({ checkoutSessionId: 'cs_test_12345' }) };
  const response = await createCheckoutSession(req);
  assert.is(response.status, 403);
  const data = await response.json();
  assert.match(data.error, /Invalid CSRF token/i);
});

/** Test: Successful checkout session creation => 200, returns session id and sets cookies */
test('returns 200 and creates a checkout session with cookies on success', async () => {
  const { POST: createCheckoutSession } = await importCreateCheckoutSession();
  const req = { json: async () => ({ checkoutSessionId: 'cs_test_12345' }) };
  const response = await createCheckoutSession(req);
  assert.is(response.status, 200);
  const data = await response.json();
  assert.is(data.id, 'cs_test_12345');
  const setCookieHeader = response.headers.get('Set-Cookie');
  assert.ok(setCookieHeader, 'Set-Cookie header is set');
});

test.run();