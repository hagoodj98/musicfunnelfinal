import { test, expect, Page } from "@playwright/test";
import Redis from "ioredis";
import { randomBytes } from "crypto";

function createRedisClient() {
  return new Redis({
    port: parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_CA_BASE64
      ? { ca: [Buffer.from(process.env.REDIS_CA_BASE64, "base64")] }
      : undefined,
  });
}

async function seedSession(page: Page, redis: Redis) {
  const sessionToken = randomBytes(32).toString("hex");
  const csrfToken = randomBytes(32).toString("hex");

  await redis.set(
    `session:${sessionToken}`,
    JSON.stringify({
      email: "checkout-errors@e2e.test",
      name: "Checkout Errors",
      status: "subscribed",
      rememberMe: true,
      ttl: 3600,
      csrfToken,
    }),
    "EX",
    3600,
  );

  await page.context().addCookies([
    {
      name: "sessionToken",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "csrfToken",
      value: csrfToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

test.describe("Checkout error visibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("shows checkout initiation server error to the user", async ({
    page,
  }) => {
    const redis = createRedisClient();
    await seedSession(page, redis);

    await page.route("**/api/create-checkout-session", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Checkout service unavailable" }),
      });
    });

    await page.goto("/landing");

    await expect(
      page.locator('[data-testid="checkout-error-message"]'),
    ).toBeVisible();
    await expect(page.getByText(/Checkout service unavailable/i)).toBeVisible();

    await redis.quit();
  });

  test("shows purchase-completed message when server reports completed checkout", async ({
    page,
  }) => {
    const redis = createRedisClient();
    await seedSession(page, redis);

    await page.route("**/api/create-checkout-session", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "Purchase already completed." }),
      });
    });

    await page.goto("/landing");

    await expect(
      page.locator('[data-testid="purchase-completed-message"]'),
    ).toBeVisible();

    await redis.quit();
  });
});
