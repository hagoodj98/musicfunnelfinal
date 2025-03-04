// Mock dependencies at the top of the file
jest.mock('../../../utils/redis', () => ({
    get: jest.fn(),
    multi: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    })),
  }));
  jest.mock('../../../utils/sessionHelpers', () => {
    const original = jest.requireActual('../../../utils/sessionHelpers');
    return {
      ...original,
      getEmailMapping: jest.fn(),
      HttpError: original.HttpError, // use the real HttpError
      updateSessionData: jest.fn(), // though not used in webhook directly
    };
  });
  
  // Import the modules we need for the tests.
  import { POST as mailchimpWebhook } from '../mailchimp/route';
  import redis from '../../../utils/redis';
  import * as sessionHelpers from '../../../utils/sessionHelpers';
  import crypto from 'crypto';
  
  // We'll also need a way to simulate a request with a text() method.
  function createRequest(bodyText) {
    return {
      text: async () => bodyText,
    };
  }
  
  describe('POST /api/webhook/mailchimp', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      jest.mock('../../../utils/redis', () => ({
        get: jest.fn(),
        multi: jest.fn(() => ({
        set: jest.fn().mockReturnThis(),
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        })),
    }));
    });
    // top-level
    
    it('returns 400 if type is not subscribe or email is missing', async () => {
      // Simulate a request body with missing email and/or wrong type.
      // For example: type is "update" and email is missing.
      const body = new URLSearchParams({
        type: 'update',
      }).toString();
      const req = createRequest(body);
  
      const response = await mailchimpWebhook(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/invalid or missing data/i);
    });
  
    it('returns 400 if verified hash does not match stored email hash (unauthorized)', async () => {
      // Use type subscribe and a valid email, but simulate a mismatch in hashes.
      const email = 'test@example.com';
      const body = new URLSearchParams({
        type: 'subscribe',
        'data[email]': email,
      }).toString();
      const req = createRequest(body);
  
      // For getEmailMapping, we simulate a mapping with a salt and an emailHash.
      // Compute the "correct" verified hash given the salt.
      const salt = 'mysalt';
      // Compute what the hash should be:
      const correctHash = crypto
        .createHmac('sha256', salt)
        .update(email.toLowerCase())
        .digest('hex');
      // Now, simulate a mapping that returns a different emailHash.
      sessionHelpers.getEmailMapping.mockResolvedValue({
        emailHash: 'differentHash', // deliberately different
        salt: salt,
      });
  
      const response = await mailchimpWebhook(req);
      // We expect a 400 for unauthorized access.
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/unauthorized access/i);
    });
  
    it('returns 404 if preliminary session data is not found', async () => {
      // Simulate a valid subscribe request.
      const email = 'test@example.com';
      const body = new URLSearchParams({
        type: 'subscribe',
        'data[email]': email,
      }).toString();
      const req = createRequest(body);
  
      // Set up mapping so that verified hash matches stored hash.
      const salt = 'mysalt';
      const correctHash = crypto
        .createHmac('sha256', salt)
        .update(email.toLowerCase())
        .digest('hex');
      sessionHelpers.getEmailMapping.mockResolvedValue({
        emailHash: correctHash,
        salt: salt,
      });
      // Simulate that preliminary session data is missing.
      redis.get.mockResolvedValue(null);
  
      const response = await mailchimpWebhook(req);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toMatch(/session data not found/i);
    });
  
    it('returns 200 and updates session when subscription is confirmed', async () => {
      // Simulate a valid subscribe request.
      const email = 'test@example.com';
      const body = new URLSearchParams({
        type: 'subscribe',
        'data[email]': email,
      }).toString();
      const req = createRequest(body);
  
      // Set up a mapping with correct salt and emailHash.
      const salt = 'mysalt';
      const correctHash = crypto
        .createHmac('sha256', salt)
        .update(email.toLowerCase())
        .digest('hex');
      sessionHelpers.getEmailMapping.mockResolvedValue({
        emailHash: correctHash,
        salt: salt,
      });
      // Simulate preliminary session data existing in Redis.
      // For example, a JSON string with a status and rememberMe flag.
      const prelimSessionData = {
        email: email,
        name: 'Test User',
        rememberMe: false,
        status: 'pending',
      };
      redis.get.mockResolvedValue(JSON.stringify(prelimSessionData));
  
      // Simulate a successful multi() operation.
      const multi = redis.multi();
      // multi.set and multi.del are chained, so they return multi.
      // multi.exec resolves to an empty array (or any value) indicating success.
      multi.exec.mockResolvedValue([]);
  
      const response = await mailchimpWebhook(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('subscribed');
      // Check that details contains the updated session data with status changed to subscribed.
      expect(data.details.status).toBe('subscribed');
    });
  });