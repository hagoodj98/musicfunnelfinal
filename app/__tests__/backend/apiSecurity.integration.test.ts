// Set env vars before any module-level code in route files runs
process.env.MAILCHIMP_WEBHOOK_TOKEN = "test-webhook-token";
process.env.INTERNAL_API_SECRET = "test-internal-secret";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
process.env.MAILCHIMP_LIST_ID = "test-list-id";

import { vi, describe, it, expect, beforeEach } from "vitest";
import type { UserSession } from "../../types/types";
import { NextRequest } from "next/server";
import { HttpError } from "../../utils/errorhandler";

// ─── Cookie store shared via ref so vi.mock factory can read it ──────────────

const cookieStoreRef: { current: ReturnType<typeof makeCookieStore> | null } = {
  current: null,
};

function makeCookieStore() {
  const store: Record<string, string> = {};
  return {
    get: vi.fn((key: string) =>
      store[key] ? { value: store[key] } : undefined,
    ),
    set: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    delete: vi.fn((key: string) => {
      delete store[key];
    }),
    _store: store,
  };
}

// ─── Hoisted mocks (needed in vi.mock factories) ─────────────────────────────

const sessionMocks = vi.hoisted(() => ({
  assertNoActiveSession: vi.fn().mockResolvedValue(undefined),
  generateToken: vi.fn().mockReturnValue({
    sessionToken: "mockSessionToken",
    csrfToken: "mockCsrfToken",
    secretSaltToken: "mockSaltToken",
  }),
  createCookie: vi.fn().mockResolvedValue(undefined),
  createSession: vi.fn().mockResolvedValue(undefined),
  updateSessionData: vi.fn().mockResolvedValue(undefined),
  getSessionDataByToken: vi.fn(),
  getSessionDataByHash: vi.fn(),
  setTimeToLive: vi.fn().mockReturnValue(600),
  createPrelimSession: vi.fn().mockResolvedValue("mockEmailHash"),
  getPrelimSession: vi.fn(),
}));

const stripeMocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  sessionsCreate: vi.fn(),
  sessionsRetrieve: vi.fn(),
}));

const checkoutMocks = vi.hoisted(() => ({
  processSuccessfulCheckout: vi.fn().mockResolvedValue(undefined),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("next/headers", () => ({ cookies: () => cookieStoreRef.current }));

vi.mock("../../../lib/redis", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    ttl: vi.fn(),
    multi: vi.fn(),
  },
}));

vi.mock("../../utils/sessionHelpers", () => ({
  assertNoActiveSession: sessionMocks.assertNoActiveSession,
  generateToken: sessionMocks.generateToken,
  createCookie: sessionMocks.createCookie,
  createSession: sessionMocks.createSession,
  updateSessionData: sessionMocks.updateSessionData,
  getSessionDataByToken: sessionMocks.getSessionDataByToken,
  getSessionDataByHash: sessionMocks.getSessionDataByHash,
  setTimeToLive: sessionMocks.setTimeToLive,
  createPrelimSession: sessionMocks.createPrelimSession,
  getPrelimSession: sessionMocks.getPrelimSession,
}));

vi.mock("../../utils/checkoutHelpers", () => ({
  processSuccessfulCheckout: checkoutMocks.processSuccessfulCheckout,
}));

vi.mock("../../utils/mailchimp", () => ({
  mailchimpClient: {
    lists: {
      getListMember: vi.fn(),
      addListMember: vi.fn(),
    },
  },
}));

vi.mock("../../utils/limiterhelpers", () => ({
  handleFindEmailRateLimit: vi.fn().mockResolvedValue(undefined),
  handleSubscribeRateLimit: vi.fn().mockResolvedValue(undefined),
  handleValidateAddressRateLimit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../utils/addressValidationClient", () => ({
  client: { send: vi.fn() },
  createLookup: vi.fn().mockImplementation(() => ({
    street: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    maxCandidates: 1,
    match: "",
    result: [] as unknown[],
  })),
}));

vi.mock("../../../environmentVarAccess", () => ({
  checkEnvVariables: vi.fn().mockReturnValue({
    stripeSecretKey: "sk_test_fake",
    stripeWebhookSecret: "whsec_fake",
    stripePriceId: "price_fake",
    listID: "list_fake",
  }),
}));

// Bypass Bottleneck throttling in tests
vi.mock("bottleneck", () => ({
  default: class {
    wrap<T>(fn: T): T {
      return fn;
    }
  },
}));

vi.mock("stripe", () => ({
  // Must be a regular function (not an arrow function) — the route calls `new Stripe(...)`.
  // Arrow functions can't be used as constructors; returning a plain object from a regular
  // constructor makes that object the result of `new Stripe(...)`.
  default: function MockStripe() {
    return {
      webhooks: { constructEvent: stripeMocks.constructEvent },
      checkout: {
        sessions: {
          create: stripeMocks.sessionsCreate,
          retrieve: stripeMocks.sessionsRetrieve,
        },
      },
    };
  },
}));

// ─── Type helpers ────────────────────────────────────────────────────────────

type RedisMock = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
  ttl: ReturnType<typeof vi.fn>;
  multi: ReturnType<typeof vi.fn>;
};

const makeSession = (overrides: Partial<UserSession> = {}): UserSession => ({
  email: "user@example.com",
  name: "Test User",
  status: "subscribed",
  ...overrides,
});

/** Build a NextRequest with a JSON body */
function jsonReq(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// ─── Shared setup ─────────────────────────────────────────────────────────────

describe("API endpoint security — remaining routes", () => {
  let redis: RedisMock;
  let cookies: ReturnType<typeof makeCookieStore>;

  beforeEach(async () => {
    cookies = makeCookieStore();
    cookieStoreRef.current = cookies;

    const redisMod = await import("../../../lib/redis");
    redis = redisMod.default as unknown as RedisMock;
    (Object.values(redis) as ReturnType<typeof vi.fn>[]).forEach((fn) =>
      fn.mockReset(),
    );

    // Reset all session mock functions back to safe defaults
    Object.values(sessionMocks).forEach((fn) => fn.mockReset());
    sessionMocks.assertNoActiveSession.mockResolvedValue(undefined);
    sessionMocks.generateToken.mockReturnValue({
      sessionToken: "mockSessionToken",
      csrfToken: "mockCsrfToken",
      secretSaltToken: "mockSaltToken",
    });
    sessionMocks.createCookie.mockResolvedValue(undefined);
    sessionMocks.createSession.mockResolvedValue(undefined);
    sessionMocks.updateSessionData.mockResolvedValue(undefined);
    sessionMocks.setTimeToLive.mockReturnValue(600);
    sessionMocks.createPrelimSession.mockResolvedValue("mockEmailHash");

    stripeMocks.constructEvent.mockReset();
    stripeMocks.sessionsCreate.mockReset();
    stripeMocks.sessionsRetrieve.mockReset();
    checkoutMocks.processSuccessfulCheckout.mockReset();
    checkoutMocks.processSuccessfulCheckout.mockResolvedValue(undefined);
  });

  // ─── POST /api/redis-handler ────────────────────────────────────────────────

  describe("POST /api/redis-handler", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      ({ POST } = await import("../../api/redis-handler/route"));
    });

    it("returns 401 when x-internal-secret header is absent", async () => {
      const req = jsonReq("http://localhost/api/redis-handler", {
        action: "get",
        key: "k",
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when x-internal-secret header is wrong", async () => {
      const req = jsonReq(
        "http://localhost/api/redis-handler",
        { action: "get", key: "k" },
        { "x-internal-secret": "wrong-secret" },
      );
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 200 and calls redis.get for action 'get'", async () => {
      redis.get.mockResolvedValue("value123");
      const req = jsonReq(
        "http://localhost/api/redis-handler",
        { action: "get", key: "mykey" },
        { "x-internal-secret": "test-internal-secret" },
      );
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(redis.get).toHaveBeenCalledWith("mykey");
    });

    it("returns 400 for an unsupported action", async () => {
      const req = jsonReq(
        "http://localhost/api/redis-handler",
        { action: "delete", key: "k" },
        { "x-internal-secret": "test-internal-secret" },
      );
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /api/mailchimp-flow ────────────────────────────────────────────────

  describe("GET /api/mailchimp-flow", () => {
    let GET: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      ({ GET } = await import("../../api/mailchimp-flow/route"));
    });

    // mailchimp-flow is an open dev-only shortcut — no x-internal-secret check.
    // It is intentionally browser-accessible so E2E tests can drive it via page.goto().

    it("stores session in Redis and redirects (302)", async () => {
      redis.set.mockResolvedValue("OK");
      const req = new NextRequest(
        "http://localhost/api/mailchimp-flow?email=user@example.com&name=Jane",
      );
      const res = await GET(req);
      expect(res.status).toBe(302);
      expect(redis.set).toHaveBeenCalled();
    });
  });

  // ─── GET /api/processing-webhook ───────────────────────────────────────────

  describe("GET /api/email-confirmation", () => {
    let GET: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      ({ GET } = await import("../../api/processing-webhook/route"));
    });

    it("returns 400 if pendingSubscription cookie is missing", async () => {
      const req = new NextRequest("http://localhost/api/email-confirmation");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("returns 401 if session status is not subscribed", async () => {
      cookies._store["pendingSubscription"] = "hashABC";
      sessionMocks.getSessionDataByHash.mockResolvedValue(
        makeSession({ status: "pending", ttl: 600 }),
      );
      const req = new NextRequest("http://localhost/api/email-confirmation");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 if session is missing ttl", async () => {
      cookies._store["pendingSubscription"] = "hashABC";
      sessionMocks.getSessionDataByHash.mockResolvedValue(
        makeSession({ status: "subscribed" }), // no ttl
      );
      const req = new NextRequest("http://localhost/api/email-confirmation");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns 200 and issues cookies when session is valid", async () => {
      cookies._store["pendingSubscription"] = "hashABC";
      sessionMocks.getSessionDataByHash.mockResolvedValue(
        makeSession({ status: "subscribed", ttl: 600 }),
      );
      const req = new NextRequest("http://localhost/api/email-confirmation");
      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(sessionMocks.createSession).toHaveBeenCalled();
      expect(sessionMocks.createCookie).toHaveBeenCalledWith(
        "sessionToken",
        "mockSessionToken",
        expect.any(Object),
      );
    });

    it("returns 402 for checkout redirects when Stripe session is not paid", async () => {
      stripeMocks.sessionsRetrieve.mockResolvedValue({
        payment_status: "unpaid",
        metadata: { sessionToken: "tok_123" },
      });

      const req = new NextRequest(
        "http://localhost/api/processing-webhook?session_id=cs_test_123",
      );
      const res = await GET(req);

      expect(res.status).toBe(402);
      expect(checkoutMocks.processSuccessfulCheckout).not.toHaveBeenCalled();
    });

    it("returns thankyou redirect payload when checkout session is paid", async () => {
      stripeMocks.sessionsRetrieve.mockResolvedValue({
        payment_status: "paid",
        metadata: { sessionToken: "tok_123" },
      });

      const req = new NextRequest(
        "http://localhost/api/processing-webhook?session_id=cs_test_123",
      );
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(checkoutMocks.processSuccessfulCheckout).toHaveBeenCalledTimes(1);
      expect(json).toEqual(
        expect.objectContaining({
          success: true,
          redirectUrl: "/landing/thankyou",
        }),
      );
    });
  });

  // ─── POST /api/webhook/mailchimp ─────────────────────────────────────────────

  describe("POST /api/webhook/mailchimp", () => {
    let POST: (req: NextRequest) => Promise<Response>;
    let GET: () => Response;

    const validWebhookHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mailchimp Webhooks",
    };

    beforeEach(async () => {
      ({ POST, GET } = await import("../../api/webhook/mailchimp/route"));
    });

    it("GET returns 200 health check", () => {
      const res = GET();
      expect(res.status).toBe(200);
    });

    it("returns 401 when webhook token is absent", async () => {
      const req = new NextRequest("http://localhost/api/webhook/mailchimp", {
        method: "POST",
        headers: validWebhookHeaders,
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when webhook token is wrong", async () => {
      const req = new NextRequest(
        "http://localhost/api/webhook/mailchimp?token=wrong-token",
        { method: "POST", headers: validWebhookHeaders },
      );
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 415 when content-type is not form-urlencoded", async () => {
      const req = new NextRequest(
        "http://localhost/api/webhook/mailchimp?token=test-webhook-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mailchimp Webhooks",
          },
        },
      );
      const res = await POST(req);
      expect(res.status).toBe(415);
    });

    it("returns 401 when user-agent does not match Mailchimp", async () => {
      const req = new NextRequest(
        "http://localhost/api/webhook/mailchimp?token=test-webhook-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0",
          },
        },
      );
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 when event type is not 'subscribe'", async () => {
      const body = "type=unsubscribe&data[email]=user@example.com";
      const req = new NextRequest(
        "http://localhost/api/webhook/mailchimp?token=test-webhook-token",
        { method: "POST", body, headers: validWebhookHeaders },
      );
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when email field is missing", async () => {
      const body = "type=subscribe";
      const req = new NextRequest(
        "http://localhost/api/webhook/mailchimp?token=test-webhook-token",
        { method: "POST", body, headers: validWebhookHeaders },
      );
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 200 and updates Redis when a valid subscribe event arrives", async () => {
      const session = makeSession({
        status: "pending",
        rememberMe: false,
        secretToken: "someSalt",
        email: "user@example.com",
      });
      sessionMocks.getPrelimSession.mockResolvedValue(session);
      sessionMocks.setTimeToLive.mockReturnValue(600);

      const mockChain = {
        set: vi.fn().mockReturnThis(),
        del: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]),
      };
      redis.multi.mockReturnValue(mockChain);

      const body = "type=subscribe&data[email]=user@example.com";
      const req = new NextRequest(
        "http://localhost/api/webhook/mailchimp?token=test-webhook-token",
        { method: "POST", body, headers: validWebhookHeaders },
      );
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockChain.exec).toHaveBeenCalled();
    });
  });

  // ─── POST /api/webhook/stripe ────────────────────────────────────────────────

  describe("POST /api/webhook/stripe", () => {
    let POST: (req: NextRequest) => Promise<Response>;
    let GETstripe: () => Response;

    beforeEach(async () => {
      ({ POST, GET: GETstripe } =
        await import("../../api/webhook/stripe/route"));
    });

    it("GET returns 200 health check", () => {
      const res = GETstripe();
      expect(res.status).toBe(200);
    });

    it("returns 401 when stripe-signature header is missing", async () => {
      // constructEvent throws when sig is null/missing → inner catch returns 401
      stripeMocks.constructEvent.mockImplementation(() => {
        throw new Error("No signature");
      });
      const req = new NextRequest("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: "{}",
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when stripe-signature verification fails", async () => {
      stripeMocks.constructEvent.mockImplementation(() => {
        throw new Error("Webhook signature verification failed");
      });
      const req = new NextRequest("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "invalid-sig" },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 200 for unhandled event types after valid signature", async () => {
      stripeMocks.constructEvent.mockReturnValue({
        type: "payment_intent.created",
        data: { object: {} },
      });
      const req = new NextRequest("http://localhost/api/webhook/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "valid-sig" },
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /api/validate-shipping-address ─────────────────────────────────────

  describe("POST /api/validate-shipping-address", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    const validPayload = {
      line1: "123 Main St",
      city: "Springfield",
      state: "IL",
      postal_code: "62701",
    };

    beforeEach(async () => {
      ({ POST } = await import("../../api/validate-shipping-address/route"));
    });

    it("returns 401 and clears cookies when session token is missing", async () => {
      cookies._store["csrfToken"] = "csrf";
      // sessionToken is absent
      redis.del.mockResolvedValue(1);
      const req = jsonReq(
        "http://localhost/api/validate-shipping-address",
        validPayload,
      );
      const res = await POST(req);
      expect(res.status).toBe(401);
      expect(cookies.delete).toHaveBeenCalledWith("sessionToken");
      expect(cookies.delete).toHaveBeenCalledWith("csrfToken");
    });

    it("returns 401 when CSRF token is missing", async () => {
      cookies._store["sessionToken"] = "tok";
      // csrfToken absent
      redis.del.mockResolvedValue(1);
      const req = jsonReq(
        "http://localhost/api/validate-shipping-address",
        validPayload,
      );
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid address schema (missing city)", async () => {
      cookies._store["sessionToken"] = "tok";
      cookies._store["csrfToken"] = "csrf";
      const { handleValidateAddressRateLimit } =
        await import("../../utils/limiterhelpers");
      vi.mocked(handleValidateAddressRateLimit).mockResolvedValue(undefined);

      const req = jsonReq("http://localhost/api/validate-shipping-address", {
        line1: "123 Main St",
        state: "IL",
        postal_code: "62701",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 422 when Smarty reports address is undeliverable", async () => {
      cookies._store["sessionToken"] = "tok";
      cookies._store["csrfToken"] = "csrf";
      const { handleValidateAddressRateLimit } =
        await import("../../utils/limiterhelpers");
      vi.mocked(handleValidateAddressRateLimit).mockResolvedValue(undefined);

      const { client, createLookup } =
        await import("../../utils/addressValidationClient");
      const mockLookup = {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        maxCandidates: 1,
        match: "",
        result: [] as unknown[],
      };
      vi.mocked(createLookup).mockReturnValue(
        mockLookup as ReturnType<typeof createLookup>,
      );
      vi.mocked(client.send).mockImplementation((async () => {
        mockLookup.result = []; // undeliverable
      }) as unknown as (
        data: Parameters<typeof client.send>[0],
      ) => ReturnType<typeof client.send>);

      const req = jsonReq(
        "http://localhost/api/validate-shipping-address",
        validPayload,
      );
      const res = await POST(req);
      expect(res.status).toBe(422);
    });

    it("returns 200 when Smarty confirms the address is deliverable", async () => {
      cookies._store["sessionToken"] = "tok";
      cookies._store["csrfToken"] = "csrf";
      const { handleValidateAddressRateLimit } =
        await import("../../utils/limiterhelpers");
      vi.mocked(handleValidateAddressRateLimit).mockResolvedValue(undefined);

      const { client, createLookup } =
        await import("../../utils/addressValidationClient");
      const mockLookup = {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        maxCandidates: 1,
        match: "",
        result: [] as unknown[],
      };
      vi.mocked(createLookup).mockReturnValue(
        mockLookup as ReturnType<typeof createLookup>,
      );
      vi.mocked(client.send).mockImplementation((async () => {
        mockLookup.result = [{ deliverability: "deliverable" }];
      }) as unknown as (
        data: Parameters<typeof client.send>[0],
      ) => ReturnType<typeof client.send>);

      const req = jsonReq(
        "http://localhost/api/validate-shipping-address",
        validPayload,
      );
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /api/create-checkout-session ───────────────────────────────────────

  describe("POST /api/create-checkout-session", () => {
    let POST: () => Promise<Response>;

    beforeEach(async () => {
      ({ POST } = await import("../../api/create-checkout-session/route"));
    });

    it("returns 401 and clears cookies when both session tokens are missing", async () => {
      redis.del.mockResolvedValue(1);
      const res = await POST();
      expect(res.status).toBe(401);
      expect(cookies.delete).toHaveBeenCalledWith("sessionToken");
      expect(cookies.delete).toHaveBeenCalledWith("csrfToken");
    });

    it("returns 401 when only the session token is present (CSRF missing)", async () => {
      cookies._store["sessionToken"] = "sess";
      redis.del.mockResolvedValue(1);
      const res = await POST();
      expect(res.status).toBe(401);
    });

    it("returns 403 when CSRF token does not match session data", async () => {
      cookies._store["sessionToken"] = "sess";
      cookies._store["csrfToken"] = "wrong-csrf";
      sessionMocks.getSessionDataByToken.mockResolvedValue(
        makeSession({ csrfToken: "correct-csrf", rememberMe: false }),
      );
      const res = await POST();
      expect(res.status).toBe(403);
    });

    it("returns 403 when checkout is already completed", async () => {
      cookies._store["sessionToken"] = "sess";
      cookies._store["csrfToken"] = "csrf";
      sessionMocks.getSessionDataByToken.mockResolvedValue(
        makeSession({
          csrfToken: "csrf",
          rememberMe: false,
          checkoutStatus: "completed",
        }),
      );
      const res = await POST();
      expect(res.status).toBe(403);
    });

    it("returns 200 and creates a Stripe checkout session for a valid request", async () => {
      cookies._store["sessionToken"] = "sess";
      cookies._store["csrfToken"] = "csrf";
      sessionMocks.getSessionDataByToken.mockResolvedValue(
        makeSession({
          csrfToken: "csrf",
          rememberMe: false,
          checkoutStatus: "active",
        }),
      );
      stripeMocks.sessionsCreate.mockResolvedValue({
        client_secret: "cs_test_secret",
      });

      const res = await POST();
      expect(res.status).toBe(200);
      expect(stripeMocks.sessionsCreate).toHaveBeenCalled();
    });
  });

  // ─── POST /api/check-subscriber ──────────────────────────────────────────────

  describe("POST /api/check-subscriber", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      ({ POST } = await import("../../api/check-subscriber/route"));
    });

    it("returns 400 for an invalid email (Zod)", async () => {
      const req = jsonReq("http://localhost/api/check-subscriber", {
        email: "notanemail",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 404 when email is not found in Mailchimp", async () => {
      const { mailchimpClient } = await import("../../utils/mailchimp");
      vi.mocked(mailchimpClient.lists.getListMember).mockRejectedValue({
        status: 404,
      });
      const req = jsonReq("http://localhost/api/check-subscriber", {
        email: "unknown@example.com",
      });
      const res = await POST(req);
      expect(res.status).toBe(404);
    });

    it("returns 403 when an active session already exists", async () => {
      sessionMocks.assertNoActiveSession.mockRejectedValue(
        new HttpError(
          "User already has an active session. Unauthorized access.",
          403,
        ),
      );
      const req = jsonReq("http://localhost/api/check-subscriber", {
        email: "user@example.com",
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("returns 200 and sets cookies when subscriber is found", async () => {
      const { mailchimpClient } = await import("../../utils/mailchimp");
      vi.mocked(mailchimpClient.lists.getListMember).mockResolvedValue({
        status: "subscribed",
        merge_fields: { FNAME: "Jane" },
      } as unknown as Awaited<
        ReturnType<typeof mailchimpClient.lists.getListMember>
      >);

      const req = jsonReq("http://localhost/api/check-subscriber", {
        email: "user@example.com",
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(sessionMocks.updateSessionData).toHaveBeenCalled();
      expect(sessionMocks.createCookie).toHaveBeenCalledWith(
        "sessionToken",
        "mockSessionToken",
        expect.any(Object),
      );
    });
  });

  // ─── POST /api/subscribe ──────────────────────────────────────────────────────

  describe("POST /api/subscribe", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      ({ POST } = await import("../../api/subscribe/route"));
    });

    it("returns 400 for invalid input (Zod validation)", async () => {
      const req = jsonReq("http://localhost/api/subscribe", {
        email: "bad",
        name: "A",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for a disposable email domain", async () => {
      const req = jsonReq("http://localhost/api/subscribe", {
        email: "user@mailinator.com",
        name: "Sarah Johnson",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for an obvious junk email pattern", async () => {
      const req = jsonReq("http://localhost/api/subscribe", {
        email: "fake@example.com",
        name: "Sarah Johnson",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for an obvious junk name", async () => {
      const req = jsonReq("http://localhost/api/subscribe", {
        email: "sarah@company.com",
        name: "John Doe",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 200 and sets the pendingSubscription cookie for a valid subscriber", async () => {
      const { mailchimpClient } = await import("../../utils/mailchimp");
      vi.mocked(mailchimpClient.lists.addListMember).mockResolvedValue(
        {} as never,
      );

      const req = jsonReq("http://localhost/api/subscribe", {
        email: "sarah@company.com",
        name: "Sarah Johnson",
        rememberMe: false,
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(sessionMocks.createPrelimSession).toHaveBeenCalled();
      expect(sessionMocks.createCookie).toHaveBeenCalledWith(
        "pendingSubscription",
        "mockEmailHash",
        expect.any(Object),
      );
    });
  });
});
