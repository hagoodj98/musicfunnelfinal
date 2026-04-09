import { vi, describe, it, expect, beforeEach } from "vitest";
import { HttpError } from "../../utils/errorhandler";
import type { UserSession } from "../../types/types";

// vi.mock calls are hoisted by vitest — define only one mock per module
vi.mock("../../utils/cryptoHelpers", () => ({
  computeEmailHash: vi.fn((salt: string, email: string): string => {
    if (salt === "correctSalt" && email === "test@example.com")
      return "storedHash";
    if (salt === "wrongSalt" && email === "test@example.com")
      return "mismatchedHash";
    return "otherHash";
  }),
}));

vi.mock("../../../lib/redis", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
  },
}));

type RedisMockDefault = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
};

// Dynamic import so next/headers can be mocked per-test
let sessionHelpers: typeof import("../../utils/sessionHelpers");

const mockCookies = () => {
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
};

/** Build a valid UserSession, merging any overrides */
const makeSession = (overrides: Partial<UserSession> = {}): UserSession => ({
  email: "test@example.com",
  name: "Test User",
  status: "pending",
  ...overrides,
});

describe("sessionHelpers integration", () => {
  let cookiesMock: ReturnType<typeof mockCookies>;
  let redis: RedisMockDefault;

  beforeEach(async () => {
    cookiesMock = mockCookies();
    const redisMod = await import("../../../lib/redis");
    redis = redisMod.default as unknown as RedisMockDefault;
    vi.doMock("next/headers", () => ({ cookies: () => cookiesMock }));
    sessionHelpers = await import("../../utils/sessionHelpers");
    (Object.values(redis) as ReturnType<typeof vi.fn>[]).forEach((fn) =>
      fn.mockReset(),
    );
  });

  // ─── getPrelimSession ────────────────────────────────────────────────────────

  it("getPrelimSession throws 404 if email mapping is not found", async () => {
    redis.get.mockResolvedValueOnce(null);
    await expect(
      sessionHelpers.getPrelimSession("test@example.com"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("getPrelimSession throws 404 if pending session is not found", async () => {
    redis.get
      .mockResolvedValueOnce("storedHash") // email mapping exists
      .mockResolvedValueOnce(null); // but no pending session
    await expect(
      sessionHelpers.getPrelimSession("test@example.com"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("getPrelimSession throws 401 if email hash does not match", async () => {
    // Use mockImplementation so both expect() calls get valid responses
    redis.get.mockImplementation((key: string) => {
      if (key === "emailReference:test@example.com")
        return Promise.resolve("storedHash");
      if (key === "prelimSession:storedHash")
        return Promise.resolve(
          JSON.stringify({
            secretToken: "wrongSalt",
            email: "test@example.com",
            name: "Test User",
            status: "pending",
          }),
        );
      return Promise.resolve(null);
    });

    await expect(
      sessionHelpers.getPrelimSession("test@example.com"),
    ).rejects.toThrowError(HttpError);
    await expect(
      sessionHelpers.getPrelimSession("test@example.com"),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("getPrelimSession returns session if email hash matches", async () => {
    const session = makeSession({ secretToken: "correctSalt" });
    redis.get
      .mockResolvedValueOnce("storedHash")
      .mockResolvedValueOnce(JSON.stringify(session));

    const result = await sessionHelpers.getPrelimSession("test@example.com");
    expect(result).toEqual(session);
  });

  // ─── getSessionDataByToken ───────────────────────────────────────────────────

  it("getSessionDataByToken throws 404 if session is not found", async () => {
    redis.get.mockResolvedValueOnce(null);
    await expect(
      sessionHelpers.getSessionDataByToken("testToken"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("getSessionDataByToken returns session data if found", async () => {
    const session = makeSession();
    redis.get.mockResolvedValueOnce(JSON.stringify(session));

    const result = await sessionHelpers.getSessionDataByToken("testToken");
    expect(result).toEqual(session);
    expect(redis.get).toHaveBeenCalledWith("session:testToken");
  });

  // ─── getSessionDataByHash ────────────────────────────────────────────────────

  it("getSessionDataByHash throws 404 if session is not found", async () => {
    redis.get.mockResolvedValueOnce(null);
    await expect(
      sessionHelpers.getSessionDataByHash("someHash"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("getSessionDataByHash returns session data and uses correct Redis key", async () => {
    const session = makeSession();
    redis.get.mockResolvedValueOnce(JSON.stringify(session));

    const result = await sessionHelpers.getSessionDataByHash("someHash");
    expect(result).toEqual(session);
    expect(redis.get).toHaveBeenCalledWith("sessionReadyForIssuance:someHash");
  });

  // ─── createSession ───────────────────────────────────────────────────────────

  it("createSession stores session data in Redis with correct key and TTL", async () => {
    const session = makeSession();
    await sessionHelpers.createSession("testToken", session, 3600);

    expect(redis.set).toHaveBeenCalledWith(
      "session:testToken",
      JSON.stringify(session),
      "EX",
      3600,
    );
  });

  // ─── updateSessionData ───────────────────────────────────────────────────────

  it("updateSessionData overwrites session data in Redis", async () => {
    const session = makeSession({ status: "subscribed" });
    await sessionHelpers.updateSessionData("testToken", session, 600);

    expect(redis.set).toHaveBeenCalledWith(
      "session:testToken",
      JSON.stringify(session),
      "EX",
      600,
    );
  });

  // ─── setTimeToLive ───────────────────────────────────────────────────────────

  it("setTimeToLive returns 1 week (604800s) when rememberMe is true", () => {
    expect(sessionHelpers.setTimeToLive(true)).toBe(604800);
  });

  it("setTimeToLive returns 10 minutes (600s) when rememberMe is false", () => {
    expect(sessionHelpers.setTimeToLive(false)).toBe(600);
  });

  // ─── generateToken ───────────────────────────────────────────────────────────
  // crypto.randomBytes is not on the WebCrypto global in the Node test env,
  // so we stub it per-test and restore afterwards.

  describe("generateToken", () => {
    let callIdx = 0;

    beforeEach(() => {
      callIdx = 0;
      vi.stubGlobal("crypto", {
        // Each call to randomBytes returns a buffer filled with a unique byte value
        randomBytes: (n: number) => Buffer.alloc(n, ++callIdx),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns a bundle with all three token fields as strings", () => {
      const bundle = sessionHelpers.generateToken();
      expect(bundle).toHaveProperty("sessionToken");
      expect(bundle).toHaveProperty("csrfToken");
      expect(bundle).toHaveProperty("secretSaltToken");
      expect(typeof bundle.sessionToken).toBe("string");
      expect(typeof bundle.csrfToken).toBe("string");
      expect(typeof bundle.secretSaltToken).toBe("string");
    });

    it("produces unique tokens across consecutive calls", () => {
      const a = sessionHelpers.generateToken();
      const b = sessionHelpers.generateToken();
      expect(a.sessionToken).not.toBe(b.sessionToken);
      expect(a.csrfToken).not.toBe(b.csrfToken);
      expect(a.secretSaltToken).not.toBe(b.secretSaltToken);
    });

    it("hex token length is twice the requested byte length", () => {
      const bundle16 = sessionHelpers.generateToken(16);
      expect(bundle16.sessionToken.length).toBe(32);
      const bundle32 = sessionHelpers.generateToken(32);
      expect(bundle32.sessionToken.length).toBe(64);
    });
  });
});
