// route.test.js
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';

let checkStatus;

// Create a mutable fakeSessionHelpers object that will be used by esmock.
// We'll override individual functions in each test as needed.
const fakeSessionHelpers = {
  getEmailMapping: async (email) => ({ emailHash: 'dummyHash' }),
  getSessionDataByHash: async (hash) => ({ status: 'subscribed', email: 'test@example.com' }),
  generateTokenAndSalt: () => ({ sessionToken: 'dummyToken', csrfToken: 'dummyCsrf' }),
  createCookie: (name, value, options) =>
    `${name}=${value}; Max-Age=${options.maxAge}`,
  updateSessionData: async (sessionToken, data, ttl) => {},
  HttpError: class HttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
};

// Before each test, use esmock to re-import the route module with the current fakeSessionHelpers.
test.before.each(async () => {
  // Adjust the relative path if needed.
  const moduleUnderTest = await esmock('./route.js', {
    '../../utils/sessionHelpers.js': fakeSessionHelpers
  });
  checkStatus = moduleUnderTest.POST;
});

test('returns 400 if email is missing', async () => {
  // 1) We don’t need to override anything for “missing email”.
  // 2) Now re-import with the current state of fakeSessionHelpers:
  const moduleUnderTest = await esmock('./route.js', {
    '../../utils/sessionHelpers.js': fakeSessionHelpers
  });
  const checkStatus = moduleUnderTest.POST;

  
  
  const req = {
    json: async () => ({
      // No email provided.
      rememberMe: false
    })
  };

  const response = await checkStatus(req);
  assert.is(response.status, 400, 'Response status should be 400');
  const data = await response.json();
  assert.match(data.error, /Email parameter is required/, 'Error message should mention missing email');
});
test('returns 401 if subscription status is not "subscribed"', async () => {
  // Override the mock to simulate a “pending” or any status other than "subscribed".
  fakeSessionHelpers.getSessionDataByHash = async (hash) => ({
    status: 'pending',
    email: 'test@example.com'
  });

  // 2) Re-import route.js after we override
  const moduleUnderTest = await esmock('./route.js', {
    '../../utils/sessionHelpers.js': fakeSessionHelpers
  });
  const checkStatus = moduleUnderTest.POST;
  
  const req = {
    json: async () => ({
      email: 'test@example.com',
      rememberMe: false
    })
  };

  const response = await checkStatus(req);
  assert.is(response.status, 401, 'Response status should be 401');
  const data = await response.json();
  assert.match(
    data.error,
    /Unauthorized access/,
    'Should return an unauthorized access message'
  );
});
test('returns 200 and sets cookies when subscription is valid', async () => {
  // Use the default “subscribed” or override if needed
  fakeSessionHelpers.getSessionDataByHash = async (hash) => ({
    status: 'subscribed',
    email: 'test@example.com'
  });
  // Also override generateTokenAndSalt if you want specific values:
  fakeSessionHelpers.generateTokenAndSalt = () => ({
    sessionToken: 'newToken',
    csrfToken: 'newCsrf'
  });
  // 2) Now re-import with esmock
  const moduleUnderTest = await esmock('./route.js', {
    '../../utils/sessionHelpers.js': fakeSessionHelpers
  });
  const checkStatus = moduleUnderTest.POST;

  const req = {
    json: async () => ({
      email: 'test@example.com',
      rememberMe: false
    })
  };

  const response = await checkStatus(req);
  assert.is(response.status, 200, 'Response status should be 200');
  const data = await response.json();
  assert.is(data.sessionToken, 'newToken', 'Session token should match mocked value');

  // Check headers for Set-Cookie
  const setCookieHeader = response.headers.get('Set-Cookie');
  assert.ok(setCookieHeader, 'Should have a Set-Cookie header');
  assert.ok(setCookieHeader.includes('sessionToken=newToken'), 'Should include sessionToken');
  assert.ok(setCookieHeader.includes('csrfToken=newCsrf'), 'Should include csrfToken');
});
test.run();