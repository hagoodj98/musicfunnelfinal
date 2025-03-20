import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';
import crypto from 'crypto';

/* ---------------------------
   Fake Dependencies
--------------------------- */

// Fake HttpError
class FakeHttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Fake sessionHelpers – we only really need getEmailMapping and HttpError for this endpoint.
const fakeSessionHelpers = {
  // For a valid email, returns a mapping with an emailHash computed using a known salt.
  getEmailMapping: async (email) => {
    // For testing, we assume salt is "secret". For email "test@example.com":
    const salt = "secret";
    const emailHash = crypto.createHmac('sha256', salt)
                            .update(email.toLowerCase())
                            .digest('hex');
    return { emailHash, salt };
  },
  HttpError: FakeHttpError,
  // updateSessionData is not used directly in this route.
  updateSessionData: async () => {}
};

// Fake redis – we need to override get and the multi chain.
const fakeRedis = {
  // Default: returns a session data string if key exists.
  get: async (key) => {
    // For a valid case, return a JSON string representing sessionData.
    // For instance, sessionData contains rememberMe and status.
    return JSON.stringify({ rememberMe: false, status: "pending", email: "test@example.com" });
  },
  // multi() returns a chain with set, del, and exec.
  multi: function () {
    return {
      set(key, value, mode, ttl) {
        this.setKey = key;
        this.value = value;
        this.mode = mode;
        this.ttl = ttl;
        return this;
      },
      del(key) {
        this.delKey = key;
        return this;
      },
      exec: async function () {
        return ['OK'];
      }
    };
  }
};

/* ---------------------------
   Helper: Import the Webhook Route
--------------------------- */

// This helper uses esmock to override dependencies as imported in route.js.
// Note: Since route.js is in the same folder as route.test.js, we use './route.js'.
async function importWebhookRoute(overrides = {}) {
  return esmock('./route.js', {
    // Override redis – note: route.js imports from '../../../utils/redis'
    '../../../utils/redis.js': { ...fakeRedis, ...overrides.redis },
    // Override sessionHelpers – route.js imports from '../../../utils/sessionHelpers'
    '../../../utils/sessionHelpers.js': { ...fakeSessionHelpers, ...overrides.sessionHelpers }
  });
}

/* ---------------------------
   Tests for /webhook/mailchimp
--------------------------- */

/** GET endpoint: should return a live message */
test('GET returns live message', async () => {
  const moduleUnderTest = await importWebhookRoute();
  const webhookGET = moduleUnderTest.GET;
  const response = webhookGET();
  assert.is(response.status, 200);
  const text = await response.text();
  assert.match(text, /Webhook endpoint is live/i);
});

/** POST: Invalid data (missing email or wrong type) should return 400 */
test('POST returns 400 if type is not "subscribe" or email is missing', async () => {
  const moduleUnderTest = await importWebhookRoute();
  const webhookPOST = moduleUnderTest.POST;
  
  // Case 1: Missing email
  const bodyMissingEmail = new URLSearchParams({
    type: 'subscribe'
    // email missing
  }).toString();
  const reqMissingEmail = {
    text: async () => bodyMissingEmail
  };
  let response = await webhookPOST(reqMissingEmail);
  assert.is(response.status, 400);
  let data = await response.json();
  assert.match(data.error, /Invalid or missing data/i);
  
  // Case 2: Type not equal to "subscribe"
  const bodyInvalidType = new URLSearchParams({
    type: 'update',
    'data[email]': 'test@example.com'
  }).toString();
  const reqInvalidType = {
    text: async () => bodyInvalidType
  };
  response = await webhookPOST(reqInvalidType);
  assert.is(response.status, 400);
  data = await response.json();
  assert.match(data.error, /Invalid or missing data/i);
});

/** POST: Unauthorized access if the verified hash does not match stored emailHash */
test('POST returns 400 Unauthorized access if hash does not match', async () => {
  // Override getEmailMapping to return an incorrect emailHash.
  const overrides = {
    sessionHelpers: {
      getEmailMapping: async (email) => {
        return { emailHash: 'wronghash', salt: 'secret' };
      }
    }
  };
  const moduleUnderTest = await importWebhookRoute(overrides);
  const webhookPOST = moduleUnderTest.POST;
  
  const body = new URLSearchParams({
    type: 'subscribe',
    'data[email]': 'test@example.com'
  }).toString();
  const req = { text: async () => body };
  const response = await webhookPOST(req);
  assert.is(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /Unauthorized access/i);
});

/** POST: Session data not found if Redis.get returns null */
test('POST returns 404 if session data not found', async () => {
  // Override redis.get to simulate missing preliminary session data.
  const redisOverride = {
    get: async (key) => null
  };
  // Also, ensure getEmailMapping returns a valid mapping.
  const salt = "secret";
  const email = "test@example.com";
  const emailHash = crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');
  const sessionHelpersOverride = {
    getEmailMapping: async (email) => ({ emailHash, salt })
  };
  const overrides = {
    redis: redisOverride,
    sessionHelpers: sessionHelpersOverride
  };
  const moduleUnderTest = await importWebhookRoute(overrides);
  const webhookPOST = moduleUnderTest.POST;
  
  const body = new URLSearchParams({
    type: 'subscribe',
    'data[email]': email
  }).toString();
  const req = { text: async () => body };
  const response = await webhookPOST(req);
  assert.is(response.status, 404);
  const data = await response.json();
  assert.match(data.error, /Session data not found/i);
});

/** POST: Successful subscription update */
test('POST returns 200 and updates session data on success', async () => {
  // Use a valid mapping and simulate session data in Redis.
  const salt = "secret";
  const email = "test@example.com";
  const emailHash = crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');
  
  // Override getEmailMapping to return the correct mapping.
  const sessionHelpersOverride = {
    getEmailMapping: async (email) => ({ emailHash, salt })
  };
  // Override redis.get to return a valid prelimSession JSON string.
  const redisOverride = {
    get: async (key) => {
      return JSON.stringify({ rememberMe: false, status: "pending", email });
    },
    // Use the default multi chain from fakeRedis.
    multi: fakeRedis.multi
  };
  
  const overrides = {
    sessionHelpers: sessionHelpersOverride,
    redis: redisOverride
  };
  const moduleUnderTest = await importWebhookRoute(overrides);
  const webhookPOST = moduleUnderTest.POST;
  
  const body = new URLSearchParams({
    type: 'subscribe',
    'data[email]': email
  }).toString();
  const req = { text: async () => body };
  const response = await webhookPOST(req);
  assert.is(response.status, 200);
  const data = await response.json();
  // Expect the returned JSON to have status "subscribed"
  assert.match(data.status, /subscribed/i);
  // Also, check that the details (parsed sessionData) have status "subscribed"
  const sessionData = data.details;
  assert.is(sessionData.status, 'subscribed');
});

test.run();