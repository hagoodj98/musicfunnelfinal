// Mock next/headers so that our route can get cookies.
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
  }));
  
  // Import cookies from next/headers (the mocked version)
  import { cookies } from 'next/headers';
  
  // Mock the Redis module so we control its behavior.
  jest.mock('../../utils/redis', () => ({
    ttl: jest.fn(),
  }));
  
  // Import redis from our utils (this will be our mock)
  import redis from '../../utils/redis';
  
  // Import the GET handler from the session-info route.
  import { GET as sessionInfo } from '../session-info/route';
  
  describe('GET /api/session-info', () => {
    // Reset mocks before each test so that tests don't affect one another.
    beforeEach(() => {
      jest.resetAllMocks();
    });
  
    it('returns 404 if session token is missing', async () => {
      // Simulate cookies() returning an object where get('sessionToken') is undefined.
      cookies.mockReturnValue(Promise.resolve({
        get: (name) => undefined
      }));
  
      const req = {}; // Minimal request object (not used by this route)
  
      const response = await sessionInfo(req);
      expect(response.status).toBe(404);
  
      const data = await response.json();
      expect(data.error).toMatch(/session token not found/i);
    });
  
    it('returns 404 if session is expired (redis TTL -2)', async () => {
      // Simulate cookies() returning a valid sessionToken.
      cookies.mockReturnValue({
        get: (name) => {
          if (name === 'sessionToken') return { value: 'abc123' };
          return undefined;
        },
      });
  
      // Simulate redis.ttl returning -2 to indicate that the key does not exist.
      redis.ttl.mockResolvedValue(-2);
  
      const req = {};
      const response = await sessionInfo(req);
      expect(response.status).toBe(404);
  
      const data = await response.json();
      expect(data.error).toMatch(/session not found or expired/i);
    });
  
    it('returns 200 and the TTL if session exists and is valid', async () => {
      // Simulate cookies() returning a valid sessionToken.
      cookies.mockReturnValue(Promise.resolve({
        get: (name) => {
          if (name === 'sessionToken') return { value: 'abc123' };
          return undefined;
        }
      }));
  
      // Simulate redis.ttl returning a positive TTL (e.g., 100 seconds).
      redis.ttl.mockResolvedValue(100);
  
      const req = {};
      const response = await sessionInfo(req);
      expect(response.status).toBe(200);
  
      const data = await response.json();
      expect(data.ttl).toBe(100);
    });
  });