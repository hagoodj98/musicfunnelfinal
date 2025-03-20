import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';

test.before.each(() => {
    process.env.STRIPE_PRICE_ID = 'price_123';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  });

// Your fake dependencies
let fakeSessionHelpers = {
  getSessionDataByToken: async (token) => ({
    csrfToken: 'validCsrf',
    email: 'test@example.com',
    checkoutStatus: 'initiated',
  }),
  updateSessionData: async () => {},
  createCookie: (name, value, options) => `${name}=${value}`,
  HttpError: class HttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
};

let fakeRedis = {
  get: async () => null,
  incr: async () => 1,     // so attempts === 1
  expire: async () => {},  // if your code calls redis.expire
  // ... add other needed Redis stubs
};

const fakeStripe = function StripeMock(secretKey) {
  return {
    checkout: {
      sessions: {
        // The route calls sessions.create(...)
        create: async (params) => {
          // Return an object with an id
          return { id: 'cs_test_12345', payment_status: 'unpaid' };
        },
        // If you also need retrieve for other tests, keep it:
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

const fakeMailchimpHelpers = {
    sendPaymentLinkEmailViaMailchimp: async (email, link) => {
      // Do nothing or log something
    },
  };
// Helper function to import your route module with mocks applied.
// Since both route.js and route.test.js are in the same folder,
// you can use './route.js'. Adjust if needed.
// 3) Helper to import with overrides:
async function importCheckCheckoutSession(overrides = {}) {
    return esmock('./route.js', {
      '../../utils/sessionHelpers.js': { ...fakeSessionHelpers, ...overrides.sessionHelpers },
      '../../utils/redis.js': { ...fakeRedis, ...overrides.redis },
      '../../utils/mailchimpHelpers.js': { ...fakeMailchimpHelpers, ...overrides.mailchimpHelpers },
      './headersWrapper.js': {
        __esModule: true,
        cookies: overrides.cookies
          ? overrides.cookies
          : async function defaultFakeCookies() {
              return {
                get: (name) => {
                  if (name === 'sessionToken') return { value: 'validSessionToken' };
                  if (name === 'csrfToken')    return { value: 'validCsrf' };
                  return undefined;
                }
              };
            }
      },
      stripe: fakeStripe
    });
  }
  

/* Example Test Using the Helper Function */
test('returns 200 and checkout session details on success', async () => {
  // Use the helper function to load the module with mocks.
  const moduleUnderTest = await importCheckCheckoutSession();
  const checkCheckoutSession = moduleUnderTest.POST;

  
  // Create a fake request that matches your expected input.
  const req = { json: async () => ({ checkoutSessionId: 'cs_test_12345' }) };
  
  const response = await checkCheckoutSession(req);
  assert.is(response.status, 200);
  const data = await response.json();
  // For a successful call, we expect the returned id to match the provided one.
  assert.is(data.id, 'cs_test_12345', 'Returned checkout session id should match');
});
/** 1) Missing session token => 401 */
test('returns 401 if session token is missing', async () => {
    // Override cookies to omit the sessionToken
    const missingSessionCookies = async () => ({
      get: (name) => {
        if (name === 'csrfToken') return { value: 'validCsrf' };
        return undefined;
      }
    });
  
    const moduleUnderTest = await importCheckCheckoutSession({
      cookies: missingSessionCookies
    });
    const checkCheckoutSession = moduleUnderTest.POST;
  
    const req = { json: async () => ({}) };
    const response = await checkCheckoutSession(req);
  
    assert.is(response.status, 401);
    const data = await response.json();
    assert.match(data.error, /Session token is required/i);
  });
  /** 2) Missing CSRF token => 401 */
test('returns 401 if CSRF token is missing', async () => {
    // Override cookies to omit the csrfToken
    const missingCsrfCookies = async () => ({
      get: (name) => {
        if (name === 'sessionToken') return { value: 'validSessionToken' };
        return undefined;
      }
    });
  
    const moduleUnderTest = await importCheckCheckoutSession({
      cookies: missingCsrfCookies
    });
    const checkCheckoutSession = moduleUnderTest.POST;
  
    const req = { json: async () => ({}) };
    const response = await checkCheckoutSession(req);
  
    assert.is(response.status, 401);
    const data = await response.json();
    assert.match(data.error, /CSRF token is required/i);
  });
  /** 3) Invalid CSRF token => 403 */
test('returns 403 if CSRF token does not match session data', async () => {
    // Force sessionData to have a different csrfToken
    const sessionHelpersOverride = {
      getSessionDataByToken: async () => ({
        csrfToken: 'differentCsrf',
        email: 'test@example.com',
        rememberMe: false
      })
    };
  
    const moduleUnderTest = await importCheckCheckoutSession({
      sessionHelpers: sessionHelpersOverride
    });
    const checkCheckoutSession = moduleUnderTest.POST;
  
    const req = { json: async () => ({}) };
    const response = await checkCheckoutSession(req);
  
    assert.is(response.status, 403);
    const data = await response.json();
    assert.match(data.error, /Invalid CSRF token/i);
  });
  /** 4) Rate limit: attempts=2 => 429 (sends payment link) */
test('returns 429 if attempts === 2 (rate limit triggered)', async () => {
    const redisOverride = {
      incr: async () => 2  // attempts = 2
    };
  
    const moduleUnderTest = await importCheckCheckoutSession({
      redis: redisOverride
    });
    const checkCheckoutSession = moduleUnderTest.POST;
  
    const req = { json: async () => ({}) };
    const response = await checkCheckoutSession(req);
  
    assert.is(response.status, 429);
    const data = await response.json();
    assert.match(data.error, /Too many checkout attempts/i);
  });
  /** 5) Rate limit: attempts >= 4 => 429 */
test('returns 429 if attempts >= 4', async () => {
    const redisOverride = {
      incr: async () => 4  // attempts = 4
    };
  
    const moduleUnderTest = await importCheckCheckoutSession({
      redis: redisOverride
    });
    const checkCheckoutSession = moduleUnderTest.POST;
  
    const req = { json: async () => ({}) };
    const response = await checkCheckoutSession(req);
  
    assert.is(response.status, 429);
    const data = await response.json();
    assert.match(data.error, /No more payment links/i);
  });
  
  /** 6) Missing STRIPE_PRICE_ID => 500 */
  test('returns 500 if STRIPE_PRICE_ID is missing', async () => {
    // Temporarily unset the environment variable
    delete process.env.STRIPE_PRICE_ID;
  
    const moduleUnderTest = await importCheckCheckoutSession();
    const checkCheckoutSession = moduleUnderTest.POST;
  
    const req = { json: async () => ({}) };
    const response = await checkCheckoutSession(req);
  
    assert.is(response.status, 500);
    const data = await response.json();
    assert.match(data.error, /Price ID is not configured/i);
  
    // Put it back for other tests
    process.env.STRIPE_PRICE_ID = 'price_123';
  });
  
test.run();