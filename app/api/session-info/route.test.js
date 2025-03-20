import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';

// Fake HttpError class from sessionHelpers
const fakeHttpError = class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
};

// Fake redis object – by default, ttl returns 3600
const fakeRedis = {
  ttl: async (key) => 3600
};

// Helper function to import the session-info route with overrides.
// Note: The route file (route.js) is in the same folder as this test file.
async function importSessionInfo(overrides = {}) {
  return esmock('./route.js', {
    // Override the Next.js headers import with our fake cookies function.
    './headersWrapper.js': {
      __esModule: true,
      cookies: overrides.cookies || async function defaultFakeCookies() {
        return {
          get: (name) => {
            if (name === 'sessionToken') return { value: 'validSessionToken' };
            return undefined;
          }
        };
      }
    },
    // Override redis and sessionHelpers as imported in route.js
    '../../utils/redis.js': { ...fakeRedis, ...overrides.redis },
    '../../utils/sessionHelpers.js': {
      HttpError: fakeHttpError,
      ...overrides.sessionHelpers
    }
  });
}

/* =========================
   TESTS
========================= */

/** 1) When the session token is present and redis.ttl returns a positive TTL, the endpoint should return 200 with the TTL. */
test('returns 200 with TTL if session token exists', async () => {
  // Use the default fake cookies (which return a valid session token) and fakeRedis.ttl returns 3600.
  const moduleUnderTest = await importSessionInfo();
  const sessionInfo = moduleUnderTest.GET;
  const req = {}; // GET does not require a body
  const response = await sessionInfo(req);
  assert.is(response.status, 200);
  const data = await response.json();
  assert.is(data.ttl, 3600);
});

/** 2) If the session token is missing, the endpoint should return 404 with an appropriate error message. */
test('returns 404 if session token is missing', async () => {
  // Override cookies to simulate missing session token.
  const missingSessionCookies = async () => ({
    get: (name) => {
      if (name === 'sessionToken') return undefined;
      return undefined;
    }
  });
  const moduleUnderTest = await importSessionInfo({ cookies: missingSessionCookies });
  const sessionInfo = moduleUnderTest.GET;
  const req = {};
  const response = await sessionInfo(req);
  assert.is(response.status, 404);
  const data = await response.json();
  assert.match(data.error, /Session token not found/i);
});

/** 3) If redis.ttl returns -2, the endpoint should return 404 with "Session not found or expired". */
test('returns 404 if TTL returns -2', async () => {
  // Override redis so that ttl returns -2.
  const redisOverride = {
    ttl: async (key) => -2
  };
  const moduleUnderTest = await importSessionInfo({ redis: redisOverride });
  const sessionInfo = moduleUnderTest.GET;
  const req = {};
  const response = await sessionInfo(req);
  assert.is(response.status, 404);
  const data = await response.json();
  assert.match(data.error, /Session not found or expired/i);
});

test.run();