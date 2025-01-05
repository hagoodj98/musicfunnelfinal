import { POST as webhookHandler } from './route';
import { createMocks } from 'node-mocks-http';
import redis from '../../utils/redis';
import crypto from 'crypto';

// Mock the entire redis module
jest.mock('../../utils/redis', () => ({
      set: jest.fn().mockResolvedValue("OK"),
      mockRejectedValue: jest.fn().mockRejectedValue(new Error('Redis error')), // Mock specific methods as needed
  }));
  
  describe('/api/webhook', () => {
    beforeEach(() => {
      // Clear all instances and calls to constructor and all methods:
      jest.clearAllMocks();
    });
  
    test('handles subscription confirmation correctly', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: 'type=subscribe&data[email]=test@example.com' //Directly setting the string without URL encoding
      });
      // Mocking req.text as it's not natively supported by node-mocks-http
        // Ensure the mock text method returns the correct format
    req.text = async () => req.body;
    res._getData = jest.fn().mockReturnValue('Webhook processed');

      await webhookHandler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getData()).toBe('Webhook processed');
      expect(redis.set).toHaveBeenCalledWith(`status:${crypto.createHash('md5').update('test@example.com'.toLowerCase()).digest('hex')}`, 'subscribed', 'EX', 3600);
    });
  
    test('returns error for invalid data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: new URLSearchParams('type=subscribe').toString()  // Missing email
      });
  
      req.text = async () => req.body;
  
      await webhookHandler(req, res);
      console.log('Status Code:', res.statusCode); // Should log the status code
      console.log('Response Data:', res._getData()); // Should log the response data
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData()).error).toBe('Invalid or missing data');
    });
  
    test('handles network or internal errors', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: new URLSearchParams('type=subscribe&data[email]=test@example.com').toString()
      });
  
      req.text = async () => req.body;
      
      // Simulate an error in Redis set operation
      redis.set.mockRejectedValue(new Error('Redis error'));
      await webhookHandler(req, res);
  
      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData()).error).toBe('Internal Server Error');
    });
  });