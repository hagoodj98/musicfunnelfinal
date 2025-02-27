import {POST as handleSubscribe } from './route';
import { createMocks } from 'node-mocks-http';
import nock from 'nock';



/**
 * Mocking External Dependencies:
We use jest.mock to replace the real implementations of Redis and the Mailchimp client with mocks. This prevents real HTTP requests and Redis calls during unit tests.
 */
jest.mock('../../utils/redis', () => ({
    set: jest.fn().mockResolvedValue("OK"),
}));
// Mock the mailchimp client
jest.mock('../../utils/mailchimp', () => ({
    mailchimpClient: {
      lists: {
        addListMember: jest.fn().mockResolvedValue({ id: 'abc123', status: 'pending' })
      }
    }
  }));
  
  // Optionally, mock Bottleneck if needed.
jest.mock('bottleneck', () => {
    return jest.fn().mockImplementation(() => ({
      wrap: (fn) => fn
    }));
});
describe('/api/subscribe', () => {
    beforeAll(() => {
       
        nock(`https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`)
            .persist()  // This will keep the mock active for all tests in this file
            .post(`/lists/${process.env.MAILCHIMP_LIST_ID}/members`, {
                email_address: 'test.user+mc@testdomain.com',
                status: "pending",
                merge_fields: {
                    FNAME: 'Test User'
                }
            })
            .reply(200, { id: 'abc123', status: 'subscribed' });
    });

    afterAll(() => {
        nock.cleanAll();
        nock.restore();
      });
    

/**
 * 	
    Using node-mocks-http:
We create mock request and response objects with createMocks() and set req.json so our endpoint can read the request body.
	•	Testing Different Scenarios:
	•	A successful subscription returns a 200 status and a JSON response with a status of "pending".
	•	Missing or invalid email cases return a 400 error with the appropriate error message.
 */

    test('successfully subscribes a user', async () => {
        // 1) Create a mock request object
        const req = {
            method: 'POST',
            json: async () => ({
            email: 'test.user+mc@testdomain.com',
            name: 'Test User',
            rememberMe: false,
            }),
        };
       
        const response = await handleSubscribe(req);

        // 3) Check the HTTP status on the returned Response
        expect(response.status).toBe(200);

// `res._getData()` is the stringified JSON your route returned
       // 4) Parse the JSON body
        const data = await response.json();
        expect(data.status).toBe('pending');
        expect(data.message).toMatch(/Subscription initiated/i);
    });
    test('returns 400 if email is missing', async () => {
        const req = {
            method: 'POST',
            json: async () => ({
                name: 'Test User',
                rememberMe: false,
            }),
        };
    
        const response = await handleSubscribe(req);
        expect(response.status).toBe(400);
        //data = await response.json() will contain the JSON body the route wrote, which in this case is { "error": "Email is required" }.
        const data = await response.json();
        //Thus, data.error should match "Email is required", and response.status should be 400.
        expect(data.error).toMatch(/Email is required/);
      });
    
      test('returns 400 if email format is invalid', async () => {
        const req = {
            method: 'POST',
            json: async () => ({
              email: 'not-an-email',
              name: 'Test User',
              rememberMe: false
            }),
          };
        
        const response = await handleSubscribe(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toMatch(/Invalid email format/);
      });
});