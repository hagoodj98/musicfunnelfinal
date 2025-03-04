
// 1) Mock the sessionHelpers module
jest.mock('../../utils/sessionHelpers', () => {
    const original = jest.requireActual('../../utils/sessionHelpers');
    return {
      ...original, 
      // For each named export you want to override:
      getSessionDataByToken: jest.fn(),
      updateSessionData: jest.fn(),
    };
  });
  jest.mock('../../utils/mailchimpHelpers', () => ({
    sendPaymentLinkEmailViaMailchimp: jest.fn(),
  }));

  jest.mock('stripe', () => {
    // Return a mock constructor
    return jest.fn().mockImplementation(() => ({
      paymentLinks: {
        create: jest.fn(),
      },
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
    }));
  });
// 1) Mock next/headers so we can simulate cookies()
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
// 1) All jest.mock calls at top level

// 2) We only need to mock Redis if we expect the code to call redis.incr, etc.
//    But for these first two tests, the route fails early (missing tokens)
//    so we might not even need a Redis mock. However, let's do it for completeness:
jest.mock('../../utils/redis', () => ({
    incr: jest.fn(),
    expire: jest.fn(),
  }));
  import redis from '../../utils/redis';
import Stripe from 'stripe';
import { sendPaymentLinkEmailViaMailchimp } from '../../utils/mailchimpHelpers';
  import { POST as createCheckoutSession } from '../create-checkout-session/route';
  import * as sessionHelpers from '../../utils/sessionHelpers';
  import { cookies } from 'next/headers';

describe('/create-checkout-session  Endpoint', () => {
    beforeEach(() => {
        jest.resetAllMocks();  // Clear all mocks so each test is fresh
         // Re-apply the default mock
        Stripe.mockImplementation(() => ({
            paymentLinks: { create: jest.fn() },
            checkout: { sessions: { create: jest.fn() } },
        }));
    });
  it('returns 401 if session token is missing', async () => {
    // We mock cookies() to return an object whose .get('sessionToken') is undefined
    cookies.mockReturnValue({
      get: (name) => {
        if (name === 'sessionToken') return undefined; // No session token
        if (name === 'csrfToken') return { value: 'someCsrf' };
        return undefined;
      },
    });
   // Also set up redis mocks for this scenario
   
   redis.incr.mockResolvedValue(1);  // or whatever you need

    // The route function expects a request object, but for this test we don't need to provide much
    const req = {};

    // Call the route
    const response = await createCheckoutSession(req);

    // We expect a 401 status
    expect(response.status).toBe(401);

    // Parse the JSON body
    const data = await response.json();
    // The route returns { error: 'Session token is required' } in the body
    expect(data.error).toMatch(/session token is required/i);
  });
  it('returns 401 if CSRF token is missing', async () => {
    // This time, sessionToken is present but csrfToken is missing
    cookies.mockReturnValue({
      get: (name) => {
        if (name === 'sessionToken') return { value: 'someSessionToken' };
        if (name === 'csrfToken') return undefined; // no csrf
        return undefined;
      },
    });

    // Again, we mock Redis in case the route tries to increment. 
    // But it should fail early for missing csrf.
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(true);

    const req = {};
    const response = await createCheckoutSession(req);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toMatch(/csrf token is required/i);
  });
  it('returns 403 if CSRF token is invalid', async () => {
    // 1. Set up the cookies() mock so that a valid session token is returned,
    // but the csrfToken from the cookie is "badCsrf".
    cookies.mockReturnValue({
      get: (name) => {
        if (name === 'sessionToken') return { value: 'validSessionToken' };
        if (name === 'csrfToken') return { value: 'badCsrf' };
        return undefined;
      },
    });
  
    // 2. Set up the sessionHelpers.getSessionDataByToken mock to return a sessionData
    // object with a CSRF token that is "goodCsrf" (different from the cookie's "badCsrf").
    // We import the module and override its method for this test.
     // 2) Here’s the key: set what getSessionDataByToken returns
     sessionHelpers.getSessionDataByToken.mockResolvedValue({
        csrfToken: 'goodCsrf',  // mismatch vs. cookie's "badCsrf"
        email: 'test@example.com',
        rememberMe: false,
      });
    // 3. For the rate limit logic, ensure that redis.incr returns 1 (so we don’t trigger rate limiting)
    // and redis.expire works as expected.
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(true);
  
    // 4. Create a minimal request object. In Next 13 route handlers, the route expects a req object with a json() method.
    const req = {
      json: async () => ({
        email: 'test@example.com',
        name: 'Test User',
        rememberMe: false,
      }),
    };
  
    // 5. Call the route handler (which is our createCheckoutSession function).
    const response = await createCheckoutSession(req);
  
    // 6. We expect a 403 status because the CSRF token from the cookie ("badCsrf") doesn't match the one in sessionData ("goodCsrf").
    expect(response.status).toBe(403);
  
    // 7. Parse the JSON body and check that the error message indicates an invalid CSRF token.
    const data = await response.json();
    expect(data.error).toMatch(/invalid csrf token/i);
  });
  it('returns 429 if rate limit is exceeded', async () => {
    // 1) cookies() mock with valid sessionToken and csrfToken
    cookies.mockReturnValue({
      get: (name) => {
        if (name === 'sessionToken') return { value: 'validSessionToken' };
        if (name === 'csrfToken') return { value: 'validCsrf' };
        return undefined;
      },
    });
  
    // 2) Mock getSessionDataByToken to return a valid session
    //    so the CSRF check passes
    sessionHelpers.getSessionDataByToken.mockResolvedValue({
      csrfToken: 'validCsrf',
      email: 'test@example.com',
      rememberMe: false,
    });
  
    // 3) Simulate that the user has already created a session once
    //    so attempts is now 2 => triggers rate limit
    redis.incr.mockResolvedValue(2);
    redis.expire.mockResolvedValue(true);
  
      // Stripe payment link
      const stripeInstance = new Stripe();
      stripeInstance.paymentLinks.create.mockResolvedValue({ url: 'http://dummy.link' });
  
            // Mock it before or in your test
    sendPaymentLinkEmailViaMailchimp.mockResolvedValue();

    // 5) Provide a minimal request object
    const req = {
      json: async () => ({
        email: 'test@example.com',
        name: 'Test User',
        rememberMe: false,
      }),
    };
    // 6) Call the route
    const response = await createCheckoutSession(req);
    // 7) We expect 429 status
    expect(response.status).toBe(429);
  
    // 8) Parse the JSON body to confirm the error message
    const data = await response.json();
    expect(data.error).toMatch(/too many checkout attempts/i);
  

    // 9) Check that we called sendPaymentLinkEmailViaMailchimp
    expect(sendPaymentLinkEmailViaMailchimp).toHaveBeenCalledWith(
      'test@example.com',
      'http://dummy.link'
    );
  });
  it('returns 500 if PRICE_ID is not configured', async () => {
    // Set up cookies to provide valid sessionToken and csrfToken.
    cookies.mockReturnValue({
      get: (name) => {
        if (name === 'sessionToken') return { value: 'someSessionToken' };
        if (name === 'csrfToken') return { value: 'validCsrf' };
        return undefined;
      },
    });
    
    // Ensure Redis mocks return values that won't trigger rate limiting.
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(true);
    
    // Mock sessionHelpers.getSessionDataByToken to return valid session data.
    sessionHelpers.getSessionDataByToken.mockResolvedValue({
      csrfToken: 'validCsrf',
      email: 'test@example.com',
      rememberMe: false,
    });
    
    // Temporarily remove STRIPE_PRICE_ID so that the route fails.
    const originalPriceId = process.env.STRIPE_PRICE_ID;
    delete process.env.STRIPE_PRICE_ID;
    
    // Create a minimal request object.
    const req = {
      json: async () => ({
        email: 'test@example.com',
        name: 'Test User',
        rememberMe: false,
      }),
    };
    
    // Call the route handler.
    const response = await createCheckoutSession(req);
    
    // Expect a 500 error because the Price ID is missing.
    expect(response.status).toBe(500);
    
    // Parse the JSON response body.
    const data = await response.json();
    expect(data.error).toMatch(/Price ID is not configured/i);
    
    // Restore the original STRIPE_PRICE_ID.
    process.env.STRIPE_PRICE_ID = originalPriceId;
  });
  it('returns 200 if checkout session is created successfully', async () => {
    // Set up cookies to simulate valid sessionToken and csrfToken.
    cookies.mockReturnValue({
      get: (name) => {
        if (name === 'sessionToken') return { value: 'validSessionToken' };
        if (name === 'csrfToken') return { value: 'validCsrf' };
        return undefined;
      },
    });
  
    // Set up the session data to be returned by getSessionDataByToken.
    sessionHelpers.getSessionDataByToken.mockResolvedValue({
      csrfToken: 'validCsrf', // Must match cookie's CSRF token.
      email: 'test@example.com',
      rememberMe: false,
    });
  
    // Simulate that the rate limit is not exceeded.
    redis.incr.mockResolvedValue(1); // First attempt.
    redis.expire.mockResolvedValue(true);
  
    // Ensure that STRIPE_PRICE_ID and STRIPE_SECRET_KEY are defined.
    process.env.STRIPE_PRICE_ID = 'price_123';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  
    // Reapply the Stripe mock (if needed) so that the route's top-level Stripe instance gets a valid mock.
    // (This is already done in your beforeEach, but we ensure it here.)
    const stripeInstance = new Stripe();
    stripeInstance.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_12345' });
    
    // Also, updateSessionData should resolve successfully.
    sessionHelpers.updateSessionData.mockResolvedValue();
  
    // Create a minimal request object. In Next 13, the route expects a req object with a json() method.
    const req = {
      json: async () => ({
        email: 'test@example.com',
        name: 'Test User',
        rememberMe: false,
      }),
    };
  
    // Call the route handler.
    const response = await createCheckoutSession(req);
  
    // Verify that the response has a 200 status.
    expect(response.status).toBe(200);
  
    // Parse the JSON body and check that it contains the session ID returned from Stripe.
    const data = await response.json();
    expect(data.id).toBe('cs_test_12345');
  
    // Check that the "Set-Cookie" header is present in the response.
    // This header should include the new sessionToken and csrfToken.
    const setCookieHeader = response.headers.get('Set-Cookie');
    expect(setCookieHeader).toBeDefined();
  });
});