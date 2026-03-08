import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';
import crypto from 'crypto';

// --- Fake Dependencies ---

// By default, the Mailchimp client returns a found member.
let fakeMailchimpClient = {
  lists: {
    getListMember: async (listID, subscriberHash) => {
      // Return a dummy member with merge_fields for first name.
      return { id: 'member-123', merge_fields: { FNAME: 'Test' } };
    }
  }
};

// By default, Redis simulates the first attempt (attempt=1).
let fakeRedis = {
  incr: async (key) => 1,
  expire: async (key, ttl) => {},
  get: async (key) => null,
  set: async (key, value, mode, ttl) => {}
};

let fakeValidateEmail = (email) => true; // always valid by default

// Minimal HttpError class.
let fakeHttpError = class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
};

// sessionHelpers overrides: generate tokens, store in Redis, create cookies.
const fakeSessionHelpers = {
  HttpError: fakeHttpError,
  generateTokenAndSalt: () => ({
    sessionToken: 'newSessionToken',
    csrfToken: 'newCsrfToken',
    salt: 'dummySalt'
  }),
  updateSessionData: async (token, data, ttl) => {
    // Simulate storing session data in Redis
  },
  createCookie: (name, value, options) =>
    `${name}=${value}; Max-Age=${options.maxAge}; SameSite=${options.sameSite || 'lax'}`
};

// --- Helper to import the route with esmock ---
async function importCheckSubscriber(overrides = {}) {
  return esmock('./route.js', {
    // Override Mailchimp
    '../../utils/mailchimp.js': { mailchimpClient: fakeMailchimpClient },
    // Override Redis
    '../../utils/redis.js': { ...fakeRedis, ...overrides.redis },
    // Override validateEmail
    '../../utils/validateEmail.js': { validateEmail: fakeValidateEmail },
    // Override sessionHelpers
    '../../utils/sessionHelpers.js': { ...fakeSessionHelpers, ...overrides.sessionHelpers }
  });
}

test.before.each(() => {
  // Provide a fake or test key
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  // Reset everything to defaults for each test
  fakeValidateEmail = (email) => true;
});

/* =======================
   TESTS
======================= */

/** 1) Missing email => 400 */
test('returns 400 if email is missing', async () => {
  const { POST: checkSubscriber } = await importCheckSubscriber();
  const req = { json: async () => ({ /* no email */ }) };
  const response = await checkSubscriber(req);
  assert.is(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /Email is required/i);
});

/** 2) Invalid email => 400 */
test('returns 400 if email format is invalid', async () => {
  // Override the validateEmail function to return false
  fakeValidateEmail = () => false;
  const { POST: checkSubscriber } = await importCheckSubscriber();
  
  const req = { json: async () => ({ email: 'not-an-email' }) };
  const response = await checkSubscriber(req);
  assert.is(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /Invalid email format/i);
});

/** 3) Redis says notFoundFlag => 404 */
test('returns 404 if redis notFoundKey is set', async () => {
  const redisOverride = {
    get: async (key) => "true" // simulate that we flagged the email as not found
  };
  const { POST: checkSubscriber } = await importCheckSubscriber({ redis: redisOverride });
  
  const req = { json: async () => ({ email: 'test@example.com' }) };
  const response = await checkSubscriber(req);
  assert.is(response.status, 404);
  const data = await response.json();
  assert.match(data.error, /couldn't find that email/i);
});

/** 4) Mailchimp returns 404 => 404 */
test('returns 404 if Mailchimp says subscriber not found', async () => {
  fakeMailchimpClient.lists.getListMember = async () => {
    const error = new Error('Not found');
    error.status = 404;
    throw error;
  };
  
  const { POST: checkSubscriber } = await importCheckSubscriber();
  const req = { json: async () => ({ email: 'test@example.com' }) };
  const response = await checkSubscriber(req);
  assert.is(response.status, 404);
  const data = await response.json();
  assert.match(data.error, /should subscribe/i);
});

/** 5) Happy Path => 200, sets cookies, includes Location: /landing */
test('returns 200 if subscriber is found, sets cookies, and redirects to /landing', async () => {
  // Revert Mailchimp to default behavior (found subscriber).
  fakeMailchimpClient.lists.getListMember = async (listID, subHash) => {
    return { id: 'member-123', merge_fields: { FNAME: 'Test' } };
  };
  
  const { POST: checkSubscriber } = await importCheckSubscriber();
  const req = { json: async () => ({ email: 'test@example.com' }) };
  const response = await checkSubscriber(req);
  assert.is(response.status, 200);

  const data = await response.json();
  assert.match(data.message, /Redirecting to landing/i);

  // Check Set-Cookie header
  const setCookieHeader = response.headers.get('Set-Cookie');
  assert.ok(setCookieHeader, 'Set-Cookie header should be present');
  assert.match(setCookieHeader, /sessionToken=newSessionToken/);
  assert.match(setCookieHeader, /csrfToken=newCsrfToken/);

  // Check the Location header
  const locationHeader = response.headers.get('Location');
  assert.is(locationHeader, '/landing');
});

/** 6) Rate limit increments attempts=1 => does not throw error */
test('does not throw error if attempts=1', async () => {
  // By default, redis.incr => 1
  const { POST: checkSubscriber } = await importCheckSubscriber();
  const req = { json: async () => ({ email: 'test@example.com' }) };
  const response = await checkSubscriber(req);
  assert.is(response.status, 200);
  // So we confirm no 429 is thrown
});

test.run();