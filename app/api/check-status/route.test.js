/**
 * Mock the helper functions (e.g. getEmailMapping, getSessionDataByHash, generateTokenAndSalt, createCookie, and updateSessionData) so that we can isolate the endpoint logic.
	2.	Test a missing email scenario.
	3.	Test a case where the subscription status isn’t “subscribed” (thus returning 401).
	4.	Test the successful case where the endpoint returns a 200 response, with a JSON body and proper cookie headers.
 */

    import { POST as checkStatus } from './route'; // Adjust path if needed
    import { 
      getEmailMapping, 
      getSessionDataByHash, 
      generateTokenAndSalt, 
      createCookie, 
      updateSessionData, 
      HttpError 
    } from '../../utils/sessionHelpers';
    
    // Mock the helper functions
    jest.mock('../../utils/sessionHelpers', () => ({
      getEmailMapping: jest.fn(),
      getSessionDataByHash: jest.fn(),
      generateTokenAndSalt: jest.fn(),
      createCookie: jest.fn(),
      updateSessionData: jest.fn(),
      // For HttpError, we can use a simple class:
      HttpError: class extends Error {
        constructor(message, status) {
          super(message);
          this.status = status;
        }
      }
    }));
    
    describe('/api/check-status Endpoint', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });
    /**
     * The test calls checkStatus(req) with a request that does not contain an email. The route should throw an HttpError that is caught and returns a Response with status 400. The test then parses the response JSON and checks that the error message includes “Email parameter is required.”
     */
      test('returns 400 if email is missing', async () => {
        const req = {
          json: async () => ({
            // No email provided; rememberMe can be any value.
            rememberMe: false,
          }),
        };
    
        const response = await checkStatus(req);
        // Check HTTP status on the returned Response object.
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toMatch(/Email parameter is required/);
      });
    /**
     * The mocks are set so that getSessionDataByHash returns a session with a status other than "subscribed". The route should then return a Response with status 401, and the test confirms the error message.
     */
      test('returns 401 if subscription status is not "subscribed"', async () => {
        // Set up the mocks:
        getEmailMapping.mockResolvedValue({ emailHash: 'abc123' });
        // Return a session data object with status other than 'subscribed'
        getSessionDataByHash.mockResolvedValue({ status: 'pending', email: 'test@example.com' });
    
        const req = {
          json: async () => ({
            email: 'test@example.com',
            rememberMe: false,
          }),
        };
    
        const response = await checkStatus(req);
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toMatch(/Unauthorized access/);
      });
    
      /**
       * 	•	Successful Scenario Test:
Mocks are configured so that the email maps to an emailHash and the session data indicates the user is subscribed. Then generateTokenAndSalt returns a new session token and CSRF token. The route updates the session data, creates cookies (mocked by createCookie), and returns a Response with status 200 and a JSON body containing the new session token. The test then checks that the response status is 200, that the body includes the message "Session active", and that the Set-Cookie header includes the expected cookies.

       */
      test('returns 200 and sets cookies when subscription is valid', async () => {
        // Set up mocks:
        getEmailMapping.mockResolvedValue({ emailHash: 'abc123' });
        getSessionDataByHash.mockResolvedValue({ status: 'subscribed', email: 'test@example.com' });
        // Simulate generating new tokens
        generateTokenAndSalt.mockReturnValue({ sessionToken: 'newToken', csrfToken: 'newCsrf' });
        // CreateCookie returns a string representing a cookie.
        createCookie.mockImplementation((name, value, options) => `${name}=${value}; Max-Age=${options.maxAge}`);
        updateSessionData.mockResolvedValue();
    
        const req = {
          json: async () => ({
            email: 'test@example.com',
            rememberMe: false,
          }),
        };
    
        const response = await checkStatus(req);
        expect(response.status).toBe(200);
    
        // Parse the JSON body
        const data = await response.json();
        expect(data.message).toMatch(/Session active/);
        expect(data.sessionToken).toBe('newToken');
    
        // Check that the 'Set-Cookie' header is present and contains expected cookie values.
        const setCookieHeader = response.headers.get('Set-Cookie');
        expect(setCookieHeader).toBeDefined();
        expect(setCookieHeader).toContain('sessionToken=newToken');
        expect(setCookieHeader).toContain('csrfToken=newCsrf');
      });
    });