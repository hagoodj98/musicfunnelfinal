import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpError } from "../../utils/errorhandler";

// Mock redis before importing sessionHelpers to avoid env var error
vi.mock("../../../lib/redis", () => ({
  __esModule: true,
  default: {
    del: vi.fn(),
    exists: vi.fn(),
  },
}));

// Use dynamic import for sessionHelpers to allow mocking cookies
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

describe("assertNoActiveSession integration", () => {
  let cookiesMock: ReturnType<typeof mockCookies>;
  let redisDel: ReturnType<typeof vi.fn>;
  let redisExists: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    cookiesMock = mockCookies();
    // Get the mocked redis functions
    const redis = await import("../../../lib/redis");
    redisDel = redis.default.del as unknown as ReturnType<typeof vi.fn>;
    redisExists = redis.default.exists as unknown as ReturnType<typeof vi.fn>;
    vi.doMock("next/headers", () => ({ cookies: () => cookiesMock }));
    sessionHelpers = await import("../../utils/sessionHelpers");
    redisDel.mockReset();
    redisExists.mockReset();
  });

  it("throws 403 if both sessionToken and csrfToken are present", async () => {
    cookiesMock.set("sessionToken", "abc");
    cookiesMock.set("csrfToken", "def");
    await expect(sessionHelpers.assertNoActiveSession()).rejects.toThrowError(
      HttpError,
    );
    await expect(sessionHelpers.assertNoActiveSession()).rejects.toMatchObject({
      status: 403,
    });
  });

  it("cleans up and throws 403 if only sessionToken is present", async () => {
    cookiesMock.set("sessionToken", "abc");
    redisExists.mockResolvedValue(true);
    await expect(sessionHelpers.assertNoActiveSession()).rejects.toMatchObject({
      status: 403,
    });
    expect(redisDel).toHaveBeenCalledWith("session:abc");
    expect(cookiesMock.delete).toHaveBeenCalledWith("sessionToken");
    expect(cookiesMock.delete).toHaveBeenCalledWith("csrfToken");
  });

  it("cleans up and throws 403 if only csrfToken is present", async () => {
    cookiesMock.set("csrfToken", "def");
    await expect(sessionHelpers.assertNoActiveSession()).rejects.toMatchObject({
      status: 403,
    });
    expect(cookiesMock.delete).toHaveBeenCalledWith("sessionToken");
    expect(cookiesMock.delete).toHaveBeenCalledWith("csrfToken");
  });

  it("does not throw if neither cookie is present", async () => {
    await expect(
      sessionHelpers.assertNoActiveSession(),
    ).resolves.toBeUndefined();
  });
});
