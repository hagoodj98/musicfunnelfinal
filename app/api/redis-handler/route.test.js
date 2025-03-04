jest.mock('../../utils/redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
  }));
  
  // Import our route function
  import { POST as redisHandler } from '../redis-handler/route';
  import redis from '../../utils/redis';
  import { HttpError } from '../../utils/sessionHelpers';
  
  describe('POST /api/redis-handler', () => {
    // Reset mocks before each test so they don't leak between tests.
    beforeEach(() => {
      jest.resetAllMocks();
    });
  
    it('returns 200 and the result for a "get" action', async () => {
      // Prepare a request that simulates a JSON body with action "get" and a key.
      const req = {
        json: async () => ({
          action: 'get',
          key: 'myKey',
        }),
      };
  
      // Simulate redis.get returning a value.
      redis.get.mockResolvedValue('myValue');
  
      // Call the endpoint.
      const response = await redisHandler(req);
  
      // Expect a 200 status and the JSON result to equal the value from redis.
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result).toBe('myValue');
      expect(redis.get).toHaveBeenCalledWith('myKey');
    });
  
    it('returns 200 and the result for a "set" action', async () => {
      // For a "set" action, the route expects to extract action and key from req.json()
      // and then use req.body.value as the value to set.
      const req = {
        json: async () => ({
          action: 'set',
          key: 'myKey',
        }),
        body: { value: 'newValue' },
      };
  
      // Simulate redis.set returning "OK".
      redis.set.mockResolvedValue('OK');
  
      // Call the endpoint.
      const response = await redisHandler(req);
  
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result).toBe('OK');
      expect(redis.set).toHaveBeenCalledWith('myKey', 'newValue');
    });
  
    it('returns 400 for unsupported action', async () => {
      const req = {
        json: async () => ({
          action: 'delete', // an unsupported action
          key: 'myKey',
        }),
      };
  
      const response = await redisHandler(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/unsupported action/i);
    });
  
    it('returns 500 if a redis call throws an error', async () => {
      const req = {
        json: async () => ({
          action: 'get',
          key: 'myKey',
        }),
      };
  
      // Simulate an error in redis.get.
      const errorMessage = 'Redis error';
      redis.get.mockRejectedValue(new Error(errorMessage));
  
      const response = await redisHandler(req);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toMatch(new RegExp(errorMessage, 'i'));
    });
  });