import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';

// We'll define default mocks here, then override them as needed in each test.
let fakeMailchimpClient, fakeMailchimpHelpers, fakeRedis, fakeStripe, fakeValidateEmail, fakeHttpError;

// A helper function to re-import `route.js` with the current mocks.
async function importCheckSubscriber() {
  return esmock('./route.js', {
    // Matches how `route.js` imports these modules:
    '../../utils/mailchimp.js': { mailchimpClient: fakeMailchimpClient },
    '../../utils/mailchimpHelpers.js': fakeMailchimpHelpers,
    '../../utils/redis.js': fakeRedis,
    '../../utils/validateEmail.js': { validateEmail: fakeValidateEmail },
    '../../utils/sessionHelpers.js': { HttpError: fakeHttpError },
    'stripe': fakeStripe
  });
}

test.before.each(() => {
  // Reset all mocks to "happy path" defaults before each test.
  fakeMailchimpClient = {
    lists: {
      getListMember: async (listID, subscriberHash) => {
        // By default, pretend the user is found in Mailchimp.
        return { id: 'some-member-id', email_address: 'test@example.com' };
      }
    }
  };

  fakeMailchimpHelpers = {
    sendPaymentLinkEmailViaMailchimp: async (email, link) => {
      // Do nothing, or log if you want to see calls
    }
  };

  fakeRedis = {
    incr: async (key) => 1,
    expire: async (key, ttl) => {},
    get: async (key) => null,
    set: async (key, value, mode, ttl) => {}
  };

  // Our Stripe mock returns a payment link with a dummy URL
  fakeStripe = function StripeMock(secretKey) {
    return {
      paymentLinks: {
        create: async (obj) => {
          return { url: 'http://dummy.link' };
        }
      }
    };
  };

  // By default, say every email is valid
  fakeValidateEmail = (email) => true;

  // Minimal HttpError class
  fakeHttpError = class HttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  };
});

/**
 * 1) Missing email => 400
 */
test('returns 400 if email is missing', async () => {
  const { POST: checkSubscriber } = await importCheckSubscriber();

  const req = { json: async () => ({ /* no email */ }) };
  const response = await checkSubscriber(req);

  assert.is(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /Email is required/i);
});

/**
 * 2) Invalid email => 400
 */
test('returns 400 if email is invalid', async () => {
  // Override the default validateEmail mock to return false
  fakeValidateEmail = () => false;
  const { POST: checkSubscriber } = await importCheckSubscriber();

  const req = { json: async () => ({ email: 'not-a-valid-email' }) };
  const response = await checkSubscriber(req);

  assert.is(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /Invalid email format/i);
});

/**
 * 3) Rate limit: attempts=2 => 429 (sends payment link)
 */
test('returns 429 if attempts === 2 (rate limit triggered)', async () => {
  // Override Redis so the second call returns 2
  fakeRedis.incr = async (key) => 2;
  const { POST: checkSubscriber } = await importCheckSubscriber();

  const req = { json: async () => ({ email: 'test@example.com' }) };
  const response = await checkSubscriber(req);

  assert.is(response.status, 429);
  const data = await response.json();
  assert.match(data.error, /too many checkout attempts/i);
});

/**
 * 4) Rate limit: attempts >= 3 => 429
 */
test('returns 429 if attempts >= 3', async () => {
  fakeRedis.incr = async (key) => 3; // Force it to 3
  const { POST: checkSubscriber } = await importCheckSubscriber();

  const req = { json: async () => ({ email: 'test@example.com' }) };
  const response = await checkSubscriber(req);

  assert.is(response.status, 429);
  const data = await response.json();
  assert.match(data.error, /no more payment links/i);
});

/**
 * 5) Redis says notFoundFlag => 404
 */
test('returns 404 if redis notFoundKey is set', async () => {
  // Make redis.get(...) return a truthy value
  fakeRedis.get = async (key) => "true";
  const { POST: checkSubscriber } = await importCheckSubscriber();

  const req = { json: async () => ({ email: 'test@example.com' }) };
  const response = await checkSubscriber(req);

  assert.is(response.status, 404);
  const data = await response.json();
  assert.match(data.error, /couldn't find that email/i);
});

/**
 * 6) Mailchimp returns 404 => 404
 */
test('returns 404 if mailchimp says subscriber not found', async () => {
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
  assert.match(data.error, /couldn't find that email/i);
});

/**
 * 7) Happy path => 200
 */
test('returns 200 if subscriber is found and rate limit is fine', async () => {
  // By default, our mocks simulate a "found" subscriber with attempts=1
  // so we don't need to override anything here.
  const { POST: checkSubscriber } = await importCheckSubscriber();

  const req = { json: async () => ({ email: 'test@example.com' }) };
  const response = await checkSubscriber(req);

  assert.is(response.status, 200);
  const data = await response.json();
  assert.match(data.message, /we found that you are a subscriber/i);
});

test.run();