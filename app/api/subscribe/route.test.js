import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';

// Ensure the environment variable for Mailchimp is set
test.before.each(() => {
  process.env.MAILCHIMP_LIST_ID = 'dummy_list_id';
});

// --- Fake Mailchimp Client ---
// We'll override mailchimpClient.lists.addListMember to simulate a successful addition.
const fakeMailchimpClient = {
  lists: {
    addListMember: async (listId, subscriber) => {
      // Simulate a response from Mailchimp – e.g., status is "pending".
      return { status: 'pending' };
    }
  }
};

// --- Fake redis ---
// We'll stub redis.set to simply resolve.
const fakeRedis = {
  set: async (key, value, mode, ttl) => {
    // You might log key, value, etc., if needed.
    return 'OK';
  }
};

// --- Fake validateEmail ---
// A simple implementation: valid if the email includes an "@".
const fakeValidateEmail = (email) => {
  return email.includes('@');
};

// --- Fake generateTokenAndSalt ---
// Return a fixed salt so we can predict the email hash.
const fakeGenerateTokenAndSalt = () => {
  return { salt: 'fixed_salt' };
};

// --- Fake HttpError ---
// A simple HttpError class matching what your route uses.
class FakeHttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// --- Helper function to import the /subscribe route with mocks ---
async function importSubscribe(overrides = {}) {
  return esmock('./route.js', {
    // Override the Mailchimp module – note the .js extension if used in your route
    '../../utils/mailchimp.js': { mailchimpClient: fakeMailchimpClient, ...overrides.mailchimp },
    // Override redis – ensure the file name is exactly as imported in your route (with .js if needed)
    '../../utils/redis.js': { ...fakeRedis, ...overrides.redis },
    // Override validateEmail
    '../../utils/validateEmail.js': { validateEmail: fakeValidateEmail },
    // Override sessionHelpers (generateTokenAndSalt and HttpError)
    '../../utils/sessionHelpers.js': {
      generateTokenAndSalt: fakeGenerateTokenAndSalt,
      HttpError: FakeHttpError,
      ...overrides.sessionHelpers
    },
    // (Bottleneck is imported from its package; we assume it works as expected.)
  });
}

/* =======================
   TESTS
======================= */

/** 1) Missing email: Should return 400 with "Email is required" */
test('returns 400 if email is missing', async () => {
  const moduleUnderTest = await importSubscribe();
  const subscribeHandler = moduleUnderTest.POST;

  // Request without email
  const req = { json: async () => ({ name: 'Test User', rememberMe: false }) };
  const response = await subscribeHandler(req);
  assert.is(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /Email is required/i);
});

/** 2) Invalid email: Should return 400 with "Invalid email format for email" */
test('returns 400 if email format is invalid', async () => {
  const moduleUnderTest = await importSubscribe();
  const subscribeHandler = moduleUnderTest.POST;

  // Request with an invalid email format
  const req = { json: async () => ({ email: 'invalid-email', name: 'Test User', rememberMe: false }) };
  const response = await subscribeHandler(req);
  assert.is(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /Invalid email format for email/i);
});

/** 3) Successful subscription initiation: Should return 200 and a pending status message */
test('returns 200 and initiates subscription on valid input', async () => {
  const moduleUnderTest = await importSubscribe();
  const subscribeHandler = moduleUnderTest.POST;

  // Request with valid email and name.
  const req = { json: async () => ({ email: 'test@example.com', name: 'Test User', rememberMe: true }) };
  const response = await subscribeHandler(req);
  assert.is(response.status, 200);

  const data = await response.json();
  assert.match(data.message, /Subscription initiated/i);
  assert.match(data.status, /pending/i);
});

test.run();