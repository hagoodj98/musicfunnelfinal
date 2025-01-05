import {POST as handleSubscribe } from './route';
import { createMocks } from 'node-mocks-http';
import nock from 'nock';

// Example mock setup in jest.setup.js or directly in your test file
jest.mock('../../utils/redis', () => ({
    set: jest.fn().mockResolvedValue("OK"),
    mockRejectedValue: jest.fn().mockRejectedValue(new Error('Redis error')), // Mock specific methods as needed
}));
  
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
            nock.emitter.on('request', (req, interceptor, body) => {
                console.log('Request was made to:', interceptor);
                console.log('Request body:', body);
              });
    });

    test('successfully subscribes a user', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: {
                email: 'test.user+mc@testdomain.com',
                name: 'Test User'
            }
        });
         // Mock necessary methods
        req.json = async () => req.body; // If req.body is already an object
        await handleSubscribe(req, res);

        console.log('Data recieved:', res._getData());
        
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).status).toBe('pending');
    });

    afterEach(() => {
        nock.cleanAll();
    });
    afterAll(() => {
        nock.restore();
      });
});