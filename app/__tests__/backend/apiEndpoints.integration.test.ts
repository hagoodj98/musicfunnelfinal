import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { UserSession } from "../../types/types";

// Use a mutable ref so the per-test cookie store can be swapped
// while the static vi.mock factory always reads the current reference.
const cookieStoreRef = {
  current: null as ReturnType<typeof makeCookieStore> | null,
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
  };
}

// Hoist these mocks so they run before any imports
vi.mock("next/headers", () => ({
  cookies: () => cookieStoreRef.current,
}));

vi.mock("../../../lib/redis", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    ttl: vi.fn(),
  },
}));

vi.mock("../../utils/cryptoHelpers", () => ({
  computeEmailHash: vi.fn(),
}));

type RedisMock = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
  ttl: ReturnType<typeof vi.fn>;
};

/** Build a valid UserSession with optional overrides */
const makeSession = (overrides: Partial<UserSession> = {}): UserSession => ({
  email: "test@example.com",
  name: "Test User",
  status: "pending",
  ...overrides,
});

describe("API endpoint security integration", () => {
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
  });

  // ─── GET /api/session-info ───────────────────────────────────────────────────

  describe("GET /api/session-info", () => {
    let GET: () => Promise<Response>;

    beforeEach(async () => {
      ({ GET } = await import("../../api/session-info/route"));
    });

    it("returns 404 if sessionToken cookie is absent", async () => {
      // No cookies set — get returns undefined
      const res = await GET();
      expect(res.status).toBe(404);
    });

    it("returns 404 if Redis reports the session as expired (ttl === -2)", async () => {
      cookies.get.mockReturnValue({ value: "tok123" });
      redis.ttl.mockResolvedValue(-2);
      const res = await GET();
      expect(res.status).toBe(404);
    });

    it("returns 200 with the remaining ttl when session is active", async () => {
      cookies.get.mockReturnValue({ value: "tok123" });
      redis.ttl.mockResolvedValue(542);
      const res = await GET();
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ttl: number };
      expect(body.ttl).toBe(542);
    });

    it("uses the correct Redis key for TTL lookup", async () => {
      cookies.get.mockReturnValue({ value: "mytoken" });
      redis.ttl.mockResolvedValue(100);
      await GET();
      expect(redis.ttl).toHaveBeenCalledWith("session:mytoken");
    });
  });

  // ─── POST /api/end-session ───────────────────────────────────────────────────

  describe("POST /api/end-session", () => {
    let POST: () => Promise<Response>;

    beforeEach(async () => {
      ({ POST } = await import("../../api/end-session/route"));
    });

    it("returns 200 and deletes the Redis session + clears both cookies", async () => {
      cookies.get.mockReturnValue({ value: "myToken" });
      const res = await POST();
      expect(res.status).toBe(200);
      expect(redis.del).toHaveBeenCalledWith("session:myToken");
      expect(cookies.delete).toHaveBeenCalledWith("sessionToken");
      expect(cookies.delete).toHaveBeenCalledWith("csrfToken");
    });

    it("returns 200 gracefully when sessionToken cookie is absent", async () => {
      cookies.get.mockReturnValue(undefined);
      const res = await POST();
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /api/refresh-session ───────────────────────────────────────────────

  describe("POST /api/refresh-session", () => {
    let POST: () => Promise<Response>;

    beforeEach(async () => {
      // Stub crypto.randomBytes so generateToken works in the Node test env
      let callIdx = 0;
      vi.stubGlobal("crypto", {
        randomBytes: (n: number) => Buffer.alloc(n, ++callIdx),
      });
      ({ POST } = await import("../../api/refresh-session/route"));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns 400 if sessionToken cookie is missing", async () => {
      cookies.get.mockImplementation((key: string) =>
        key === "csrfToken" ? { value: "somecsrf" } : undefined,
      );
      const res = await POST();
      expect(res.status).toBe(400);
    });

    it("returns 400 if csrfToken cookie is missing", async () => {
      cookies.get.mockImplementation((key: string) =>
        key === "sessionToken" ? { value: "sessToken" } : undefined,
      );
      const res = await POST();
      expect(res.status).toBe(400);
    });

    it("returns 403 if CSRF token does not match stored session", async () => {
      cookies.get.mockImplementation((key: string) => {
        if (key === "sessionToken") return { value: "myToken" };
        if (key === "csrfToken") return { value: "wrongCsrf" };
        return undefined;
      });
      const session = makeSession({
        csrfToken: "correctCsrf",
        rememberMe: false,
      });
      redis.get.mockResolvedValue(JSON.stringify(session));
      const res = await POST();
      expect(res.status).toBe(403);
    });

    it("returns 200 and rotates both session and CSRF tokens on success", async () => {
      cookies.get.mockImplementation((key: string) => {
        if (key === "sessionToken") return { value: "myToken" };
        if (key === "csrfToken") return { value: "correctCsrf" };
        return undefined;
      });
      const session = makeSession({
        csrfToken: "correctCsrf",
        rememberMe: false,
      });
      redis.get.mockResolvedValue(JSON.stringify(session));

      const res = await POST();
      expect(res.status).toBe(200);
      // Verify new tokens are persisted to Redis
      expect(redis.set).toHaveBeenCalled();
      // Verify new cookies are issued
      expect(cookies.set).toHaveBeenCalledWith(
        "sessionToken",
        expect.any(String),
        expect.any(Object),
      );
      expect(cookies.set).toHaveBeenCalledWith(
        "csrfToken",
        expect.any(String),
        expect.any(Object),
      );
    });

    it("returns 500 if session data is missing rememberMe", async () => {
      cookies.get.mockImplementation((key: string) => {
        if (key === "sessionToken") return { value: "myToken" };
        if (key === "csrfToken") return { value: "csrf" };
        return undefined;
      });
      // Session with matching csrf but no rememberMe
      const session = makeSession({ csrfToken: "csrf" });
      // omit rememberMe — it's undefined by default in makeSession
      redis.get.mockResolvedValue(JSON.stringify(session));
      const res = await POST();
      expect(res.status).toBe(500);
    });
  });
});
