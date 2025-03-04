import { POST as checkSubscriber } from '../check-subscriber/route';
import crypto from 'crypto';
import { HttpError } from '../../utils/sessionHelpers';
import redis from '../../utils/redis';
import { mailchimpClient } from '../../utils/mailchimp';
import { sendPaymentLinkEmailViaMailchimp } from '../../utils/mailchimpHelpers';
import Stripe from 'stripe';



// Mock Redis methods
jest.mock('../../utils/redis', () => ({
  incr: jest.fn(),
  expire: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
}));

// At the top of your test file:
jest.mock('stripe', () => {
    const createFn = jest.fn();
    return jest.fn().mockImplementation(() => ({
      paymentLinks: {
        create: createFn
      }
    }));
  });
  jest.mock('../../utils/sessionHelpers', () => {
    const original = jest.requireActual('../../utils/sessionHelpers');
    return {
      ...original, // preserve the real HttpError
      // override only the functions you need to mock
      getSessionDataByToken: jest.fn(),
    };
  });
// Mock Mailchimp client
jest.mock('../../utils/mailchimp', () => ({
  mailchimpClient: {
    lists: {
      getListMember: jest.fn(),
    },
  },
}));

// Mock the email sending helper
jest.mock('../../utils/mailchimpHelpers', () => ({
  sendPaymentLinkEmailViaMailchimp: jest.fn(),
}));



// Dummy payment link object returned by Stripe
const dummyStripePaymentLink = { url: 'http://dummy.payment.link' };

describe('/api/check-subscriber Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    // Re-define the default mock for Stripe
    const StripeModule = require('stripe');
    StripeModule.mockImplementation(() => ({
      paymentLinks: {
        create: jest.fn(),
      },
    }));
  });
/**
 * The test sends a request with no email, so your route should throw an HttpError with status 400.
	•	The test checks that response.status is 400 and that the returned JSON has an error message matching “Email is required.”
 */
  test('returns 400 if email is missing', async () => {
    // Prepare a mock request object
    const req = {
      json: async () => ({
        // Missing email
        name: 'Test User',
        rememberMe: false,
      }),
    };

    const response = await checkSubscriber(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/Email is required/);
  });
/**
 * We simulate that Redis.incr returns 3 (meaning the user has called the endpoint more than allowed).
	•	The test expects a 429 error with an appropriate error message.
 */
  test('returns 429 if rate limit exceeded', async () => {
    // Simulate that the user has already called more than allowed
    redis.incr.mockResolvedValue(3); // attempts > 2 triggers rate limit
    redis.expire.mockResolvedValue(true);

    const req = {
      json: async () => ({
        email: 'test@example.com',
      }),
    };

    const response = await checkSubscriber(req);
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toMatch(/reached your limit/i);
  });
/**
 * We simulate that the Redis key notFound:test@example.com is already set (by mocking redis.get to return “true”).
	•	The route should immediately throw a 404 error with an error message indicating the email is not found.
 */
  test('returns 404 immediately if notFound flag is set', async () => {
    // Simulate rate limit within allowed window
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(true);
    // Simulate that we've previously flagged this email as not found
    redis.get.mockResolvedValue("true");

    const req = {
      json: async () => ({
        email: 'test@example.com',
      }),
    };

    const response = await checkSubscriber(req);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toMatch(/ couldn['’]t find that email.*subscribe/i);
  });
/**
 * We simulate a valid rate limit and no notFound flag initially.
	•	We then simulate that Mailchimp’s API (mailchimpClient.lists.getListMember) throws a 404 error.
	•	The endpoint should catch that error, set the notFound flag in Redis (with an expiration of 86400 seconds), and then return a 404 response.
 */
  test('returns 404 if Mailchimp returns 404 and sets notFound flag', async () => {
    // Simulate a fresh call with allowed rate limit
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(true);
    // Ensure the notFound flag is not set initially.
    redis.get.mockResolvedValue(null);

    // Set up Stripe payment link creation
    const stripeInstance = new Stripe();
    stripeInstance.paymentLinks.create.mockResolvedValue(dummyStripePaymentLink);

    // Simulate successful sending of email
    sendPaymentLinkEmailViaMailchimp.mockResolvedValue();

    // 5) **Here’s the key**: throw an actual HttpError with status=404
    mailchimpClient.lists.getListMember.mockRejectedValue(
      new HttpError("Mhm we couldn't find that email. You should subscribe!🙃", 404)
    );


    const req = {
      json: async () => ({
        email: 'test@example.com',
      }),
    };

    const response = await checkSubscriber(req);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toMatch(/not found.*subscribe/i);
    // Verify that we set the notFound flag for 24 hours.
    expect(redis.set).toHaveBeenCalledWith(`notFound:test@example.com`, "true", "EX", 86400);
  });
/**
 * We simulate all external dependencies (rate limit, Stripe, email sending, and Mailchimp member lookup) succeeding.
	•	The endpoint should return a 200 status with a success message.
	•	The test checks that the status is 200 and that the message indicates the subscriber was found.
 */

    test('returns 200 if subscriber is found', async () => {
        const StripeModule = require('stripe');
        // Provide a mockResolvedValue for the .create method
        StripeModule.mockImplementation(() => ({
            paymentLinks: {
            create: jest.fn().mockResolvedValue({ url: 'http://dummy.link' })
            }
        }));


        // Force attempts=1 => no rate limit
        redis.incr.mockResolvedValue(1);
        redis.expire.mockResolvedValue(true);

        // no notFoundFlag
        redis.get.mockResolvedValue(null);

        // mailchimp returns success
        mailchimpClient.lists.getListMember.mockResolvedValue({ id: 'member123' });

        // No error from email sending
        sendPaymentLinkEmailViaMailchimp.mockResolvedValue();

        // Build the request
        const req = {
        json: async () => ({ email: 'test@example.com' }),
        };

        const response = await checkSubscriber(req);
        console.log('Actual status returned:', response.status);
        const data = await response.json();
        console.log('Actual body returned:', data);

        expect(response.status).toBe(200);
        expect(data.message).toMatch(/we found that you are a subscriber/i);
        });
});