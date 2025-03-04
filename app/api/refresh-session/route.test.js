// Mock next/headers so that our route can get cookies.
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
  }));
  
  // Mock Redis (used in sessionHelpers)
  jest.mock('../../utils/redis', () => ({
    incr: jest.fn(),
    expire: jest.fn(),
  }));
  
  // Mock sessionHelpers so we can control getSessionDataByToken, updateSessionData, etc.
  jest.mock('../../utils/sessionHelpers', () => {
    const originalModule = jest.requireActual('../../utils/sessionHelpers');
    return {
      ...originalModule,
      getSessionDataByToken: jest.fn(),
      updateSessionData: jest.fn(),
      createCookie: jest.fn((name, value, options) => `${name}=${value}; Max-Age=${options.maxAge}; SameSite=${options.sameSite || ''}`),
      // We can leave generateTokenAndSalt as the original or mock it.
      generateTokenAndSalt: jest.fn(() => ({
        sessionToken: 'newToken123',
        csrfToken: 'newCsrf123'
      })),
      HttpError: originalModule.HttpError,
    };
  });
  
  // Import our route handler and dependencies.
  import { POST as refreshSession } from '../refresh-session/route';
  import { cookies } from 'next/headers';
  import * as sessionHelpers from '../../utils/sessionHelpers';
  import redis from '../../utils/redis';
  
  describe('/api/refresh-session Endpoint', () => {
    beforeEach(() => {
      // Reset all mocks before each test.
      jest.resetAllMocks();
    });
  
    it('returns 400 if session token is missing', async () => {
      // Simulate cookies() returning undefined for sessionToken.
      cookies.mockReturnValue({
        get: (name) => {
          if (name === 'sessionToken') return undefined;
          if (name === 'csrfToken') return { value: 'someCsrf' };
          return undefined;
        },
      });
  
      const req = {}; // The endpoint doesn't use req.json() in this case.
      const response = await refreshSession(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/session token is required/i);
    });
  
    it('returns 400 if CSRF token is missing', async () => {
      // Session token exists but csrfToken is missing.
      cookies.mockReturnValue({
        get: (name) => {
          if (name === 'sessionToken') return { value: 'validSessionToken' };
          if (name === 'csrfToken') return undefined;
          return undefined;
        },
      });
  
      const req = {};
      const response = await refreshSession(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/csrf token is required/i);
    });
  
    it('returns 403 if CSRF token does not match', async () => {
      // Valid cookies but the token in session data is different.
      cookies.mockReturnValue({
        get: (name) => {
          if (name === 'sessionToken') return { value: 'validSessionToken' };
          if (name === 'csrfToken') return { value: 'badCsrf' };
          return undefined;
        },
      });
      // Mock sessionHelpers.getSessionDataByToken to return session data with a valid CSRF that does not match.
      sessionHelpers.getSessionDataByToken.mockResolvedValue({
        csrfToken: 'goodCsrf',
        email: 'test@example.com',
        rememberMe: false,
      });
      // Rate-limit mocks (even though they might not be reached)
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(true);
  
      const req = { json: async () => ({ email: 'test@example.com' }) };
      const response = await refreshSession(req);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toMatch(/invalid csrf token\. unauthorized!/i);
    });
  
    it('returns 200 if session is refreshed successfully', async () => {
      // Provide valid cookies.
      cookies.mockReturnValue({
        get: (name) => {
          if (name === 'sessionToken') return { value: 'validSessionToken' };
          if (name === 'csrfToken') return { value: 'validCsrf' };
          return undefined;
        },
      });
      // Simulate session data in Redis with matching csrf.
      sessionHelpers.getSessionDataByToken.mockResolvedValue({
        csrfToken: 'validCsrf',
        email: 'test@example.com',
        rememberMe: false,
      });
      // For rate limit, simulate first attempt.
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(true);
  
      // generateTokenAndSalt is already mocked to return new tokens: newToken123 and newCsrf123.
      // updateSessionData resolves successfully.
      sessionHelpers.updateSessionData.mockResolvedValue();
  
      const req = { json: async () => ({ email: 'test@example.com' }) };
      const response = await refreshSession(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toMatch(/session refreshed/i);
  
      // Also check that the Set-Cookie header is present.
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('sessionToken=newToken123');
      expect(setCookieHeader).toContain('csrfToken=newCsrf123');
    });
  });