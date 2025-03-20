import { test } from 'uvu';
import * as assert from 'uvu/assert';
import esmock from 'esmock';

// 1) Create default mocks for redis and HttpError:
const fakeRedis = {
  get: async (key) => "someValue",
  set: async (key, value) => "OK"
};

const fakeHttpError = class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
};

// 2) Helper function to import the route with overrides
async function importRedisHandler(overrides = {}) {
  return esmock('./route.js', {
    // Match how route.js imports redis and sessionHelpers
    '../../utils/redis.js': { ...fakeRedis, ...overrides.redis },
    '../../utils/sessionHelpers.js': {
      HttpError: fakeHttpError,
      // If you need other sessionHelpers exports, mock them here
      ...overrides.sessionHelpers
    },
  });
}

/* =======================
   TESTS
======================= */

/** 1) GET action => calls redis.get(key) => returns 200 with the value */
test('handles "get" action successfully', async () => {
  const moduleUnderTest = await importRedisHandler();
  const redisHandler = moduleUnderTest.POST;

  const req = {
    json: async () => ({
      action: 'get',
      key: 'testKey'
    })
  };

  const response = await redisHandler(req);
  assert.is(response.status, 200);

  const data = await response.json();
  // Our default fakeRedis.get returns "someValue"
  assert.is(data.result, 'someValue');
});

/** 2) SET action => calls redis.set(key, req.body.value) => returns 200 with "OK" */
test('handles "set" action successfully', async () => {
  const moduleUnderTest = await importRedisHandler();
  const redisHandler = moduleUnderTest.POST;

  const req = {
    json: async () => ({
      action: 'set',
      key: 'testKey',
      value: 'someNewValue'
    }),
    // route.js uses req.body.value, so define it here:
    body: {
      value: 'someNewValue'
    }
  };

  const response = await redisHandler(req);
  assert.is(response.status, 200);

  const data = await response.json();
  // Our default fakeRedis.set returns "OK"
  assert.is(data.result, 'OK');
});

/** 3) Unsupported action => throws HttpError(400) */
test('throws 400 for unsupported action', async () => {
  const moduleUnderTest = await importRedisHandler();
  const redisHandler = moduleUnderTest.POST;

  const req = {
    json: async () => ({
      action: 'delete',
      key: 'testKey'
    })
  };

  const response = await redisHandler(req);
  assert.is(response.status, 400);

  const data = await response.json();
  assert.match(data.error, /Unsupported action/i);
});

/** 4) Redis fails => returns 500 */
test('throws 500 if redis fails', async () => {
  // Force redis to throw an error
  const failingRedis = {
    get: async () => { throw new Error('Redis error'); },
    set: async () => { throw new Error('Redis error'); }
  };

  const moduleUnderTest = await importRedisHandler({
    redis: failingRedis
  });
  const redisHandler = moduleUnderTest.POST;

  const req = {
    json: async () => ({
      action: 'get',
      key: 'testKey'
    })
  };

  const response = await redisHandler(req);
  assert.is(response.status, 500);

  const data = await response.json();
  assert.match(data.error, /Redis error/i);
});

test.run();