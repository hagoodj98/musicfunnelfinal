// File: app/api/refresh-session/route.test.js
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';

// --- Fake sessionHelpers ---
const fakeSessionHelpers = {
  getSessionDataByToken: async (token) => {
    // Default: returns session data with matching CSRF token.
    return {
      csrfToken: 'validCsrf',
      email: 'test@example.com',
      rememberMe: false // This will yield ttl = 100
    };
  },
  updateSessionData: async (newToken, data, ttl) => {
    // Simply resolve; in real life it writes to Redis.
    return;
  },
  generateTokenAndSalt: () => {
    // Return new tokens.
    return { sessionToken: 'newSessionToken', csrfToken: 'newCsrfToken' };
  },
  createCookie: (name, value, options) => {
    // Return a simple cookie string.
    return `${name}=${value}; Max-Age=${options.maxAge}; SameSite=${options.sameSite || 'Lax'}`;
  },
  HttpError: class HttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
};

// --- Fake redis (if needed by sessionHelpers) ---
// (Not used in refresh-session route, so a minimal stub is enough.)
const fakeRedis = {};

// --- Helper to import the refresh-session route with our overrides ---
async function importRefreshSession(overrides = {}) {
  return esmock('./route.js', {
    '../../utils/sessionHelpers.js': {
      ...fakeSessionHelpers,
      ...overrides.sessionHelpers
    },
    // Override next/headers by overriding our local headersWrapper.js file.
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
    '../../utils/redis.js': { ...fakeRedis, ...overrides.redis }
  });
}

/* =======================
   TESTS
======================= */

/** 1) Missing session token => should return 400 with "Session token is required" */
test('returns 400 if session token is missing', async () => {
  // Override cookies to omit the sessionToken.
  const missingSessionCookies = async () => ({
    get: (name) => {
      if (name === 'csrfToken') return { value: 'validCsrf' };
      return undefined; // no session token
    }
  });

  const moduleUnderTest = await importRefreshSession({
    cookies: missingSessionCookies
  });
  const refreshSession = moduleUnderTest.POST;

  const req = { json: async () => ({}) };
  const response = await refreshSession(req);
  assert.is(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /Session token is required/i);
});

/** 2) Missing CSRF token => should return 400 with "CSRF token is required" */
test('returns 400 if CSRF token is missing', async () => {
  // Override cookies to omit the CSRF token.
  const missingCsrfCookies = async () => ({
    get: (name) => {
      if (name === 'sessionToken') return { value: 'validSessionToken' };
      return undefined; // no CSRF token
    }
  });

  const moduleUnderTest = await importRefreshSession({
    cookies: missingCsrfCookies
  });
  const refreshSession = moduleUnderTest.POST;

  const req = { json: async () => ({}) };
  const response = await refreshSession(req);
  assert.is(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /CSRF token is required/i);
});

/** 3) Invalid CSRF token => should return 403 with "Invalid CSRF token. Unauthorized!" */
test('returns 403 if CSRF token does not match session data', async () => {
  // Override getSessionDataByToken so it returns a different CSRF token.
  const sessionHelpersOverride = {
    getSessionDataByToken: async () => ({
      csrfToken: 'differentCsrf', // does not match cookie's 'validCsrf'
      email: 'test@example.com',
      rememberMe: false
    })
  };

  const moduleUnderTest = await importRefreshSession({
    sessionHelpers: sessionHelpersOverride
  });
  const refreshSession = moduleUnderTest.POST;

  const req = { json: async () => ({}) };
  const response = await refreshSession(req);
  assert.is(response.status, 403);
  const data = await response.json();
  assert.match(data.error, /Invalid CSRF token. Unauthorized!/i);
});

/** 4) Successful refresh => returns 200 with refreshed session cookies */
test('returns 200 and refreshed session on success', async () => {
  // Use default fake cookies (valid sessionToken and CSRF token) and default sessionHelpers.
  const moduleUnderTest = await importRefreshSession();
  const refreshSession = moduleUnderTest.POST;

  const req = { json: async () => ({}) };
  const response = await refreshSession(req);
  assert.is(response.status, 200);
  const data = await response.json();
  assert.match(data.message, /Session refreshed/i);

  // Check that the Set-Cookie header exists and contains the new tokens.
  const setCookieHeader = response.headers.get('Set-Cookie');
  assert.ok(setCookieHeader, 'Set-Cookie header is set');
  assert.ok(setCookieHeader.includes('sessionToken=newSessionToken'), 'sessionToken cookie is updated');
  assert.ok(setCookieHeader.includes('csrfToken=newCsrfToken'), 'csrfToken cookie is updated');
});

test.run();