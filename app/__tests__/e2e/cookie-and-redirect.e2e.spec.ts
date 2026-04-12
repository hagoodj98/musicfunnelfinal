import { test, expect, Page } from "@playwright/test";
import Redis from "ioredis";
import { randomBytes } from "crypto";

/**
 * Seeds a full authenticated session (sessionToken + csrfToken) directly into
 * Redis and the browser cookie jar via addCookies().
 *
 * This approach bypasses the API flow entirely, which avoids the well-known
 * WebKit limitation where Set-Cookie headers from fetch()/XHR responses are not
 * stored in the browser's httpOnly cookie jar. addCookies() injects cookies
 * directly into the browser context and works reliably in all browsers.
 */
async function seedSession(
  page: Page,
  email: string,
  name: string,
  rememberMe = true,
  redis: Redis,
) {
  const sessionToken = randomBytes(32).toString("hex");
  const csrfToken = randomBytes(32).toString("hex");
  const ttl = rememberMe ? 86400 : 3600;

  await redis.set(
    `session:${sessionToken}`,
    JSON.stringify({
      email,
      name,
      status: "subscribed",
      rememberMe,
      ttl,
      csrfToken,
    }),
    "EX",
    ttl,
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

test.describe("Cookie and Redirect Behavior", () => {
  // WebKit race: after networkidle, router.push('/') from SessionManagerProvider.catch
  // may still be pending in the JS task queue if '/' is prefetched (no network activity).
  // One retry is sufficient to handle this inherently timing-dependent scenario.
  test.describe.configure({ retries: 1 });

  test("User deletes cookies and tries to access app", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Delete cookies
    const context = page.context();
    await context.clearCookies();

    // Try accessing a protected route
    await page.goto("/landing");

    // Expect redirect to home with error message
    await expect(page).toHaveURL(
      "http://localhost:3000/?msg=You%2520cannot%2520proceed%2520without%2520an%2520active%2520session%21%21",
    );
    await expect(
      page.locator("text=You cannot proceed without an active session!!"),
    ).toBeVisible();
  });

  test("User returns to landing page after checkout", async ({ page }) => {
    const redis = new Redis({
      port: parseInt(process.env.REDIS_PORT || "6379"),
      host: process.env.REDIS_HOST,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_CA_BASE64
        ? { ca: [Buffer.from(process.env.REDIS_CA_BASE64, "base64")] }
        : undefined,
    });

    // Clear any lingering cookies from previous tests.
    await page.context().clearCookies();

    // Seed a full session directly into Redis + browser cookie jar.
    await seedSession(page, "returns@e2e.test", "Returns E2E", true, redis);

    // Step 3: Read the issued sessionToken from browser cookies
    // (Playwright can read httpOnly cookies via CDP)
    const browserCookies = await page
      .context()
      .cookies("http://localhost:3000");
    const sessionToken = browserCookies.find(
      (c) => c.name === "sessionToken",
    )?.value;
    expect(sessionToken).toBeTruthy();

    // Step 4: Simulate Stripe checkout completing — update checkoutStatus in Redis
    // (In production this is done by the Stripe webhook after successful payment)
    const sessionDataStr = await redis.get(`session:${sessionToken}`);
    const sessionData = JSON.parse(sessionDataStr!);
    await redis.set(
      `session:${sessionToken}`,
      JSON.stringify({ ...sessionData, checkoutStatus: "completed" }),
      "EX",
      sessionData.ttl ?? 86400,
    );

    // Step 5: Revisit /landing after checkout completion.
    await page.goto("/landing");
    await expect(page).toHaveURL(/\/landing/);

    // Subscription form should NOT be present on /landing (it only exists on /)
    await expect(page.locator("form#subscription-form")).not.toBeVisible();

    await redis.quit();
  });

  test("Green banner appears on checkout completion", async ({ page }) => {
    const redis = new Redis({
      port: parseInt(process.env.REDIS_PORT || "6379"),
      host: process.env.REDIS_HOST,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_CA_BASE64
        ? { ca: [Buffer.from(process.env.REDIS_CA_BASE64, "base64")] }
        : undefined,
    });

    // Clear any lingering cookies from previous tests.
    await page.context().clearCookies();

    // Seed a full session directly into Redis + browser cookie jar.
    await seedSession(page, "banner@e2e.test", "Banner E2E", true, redis);

    // Step 3: Read the issued sessionToken from browser cookies
    const browserCookies = await page
      .context()
      .cookies("http://localhost:3000");
    const sessionToken = browserCookies.find(
      (c) => c.name === "sessionToken",
    )?.value;
    expect(sessionToken).toBeTruthy();

    // Step 4: Simulate Stripe checkout completing — update checkoutStatus in Redis.
    // With checkoutStatus === "completed", the real /api/create-checkout-session
    // endpoint will return 403 "Purchase already completed." — no mocking needed.
    const sessionDataStr = await redis.get(`session:${sessionToken}`);
    const sessionData = JSON.parse(sessionDataStr!);
    await redis.set(
      `session:${sessionToken}`,
      JSON.stringify({ ...sessionData, checkoutStatus: "completed" }),
      "EX",
      sessionData.ttl ?? 86400,
    );

    // Step 5: Visit /landing — middleware allows through, CheckoutInitiator calls
    // /api/create-checkout-session which hits the real 403 branch and shows the banner
    await page.goto("/landing");
    await expect(page).toHaveURL(/\/landing/);

    // Banner should appear because the real API returned "Purchase already completed."
    await expect(
      page.locator('[data-testid="purchase-completed-message"]'),
    ).toBeVisible({ timeout: 10000 });

    await redis.quit();
  });

  test("Mock session to bypass middleware", async ({ page }) => {
    const redis = new Redis({
      port: parseInt(process.env.REDIS_PORT || "6379"),
      host: process.env.REDIS_HOST,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_CA_BASE64
        ? { ca: [Buffer.from(process.env.REDIS_CA_BASE64, "base64")] }
        : undefined,
    });

    // Clear any lingering cookies from previous tests.
    await page.context().clearCookies();

    // Seed a full session directly into Redis + browser cookie jar.
    await seedSession(page, "bypass@e2e.test", "Bypass E2E", true, redis);

    // Step 3: Read the issued sessionToken from browser cookies
    const browserCookies = await page
      .context()
      .cookies("http://localhost:3000");
    const sessionToken = browserCookies.find(
      (c) => c.name === "sessionToken",
    )?.value;
    expect(sessionToken).toBeTruthy();

    // Step 4: Mark checkout as completed so the real /api/create-checkout-session
    // returns 403 "Purchase already completed." — no mocking needed
    const sessionDataStr = await redis.get(`session:${sessionToken}`);
    const sessionData = JSON.parse(sessionDataStr!);
    await redis.set(
      `session:${sessionToken}`,
      JSON.stringify({ ...sessionData, checkoutStatus: "completed" }),
      "EX",
      sessionData.ttl ?? 86400,
    );

    // Step 5: Visit /landing — middleware allows through, banner appears
    await page.goto("/landing");
    await expect(page).toHaveURL(/\/landing/);

    // Expect 'Purchase already completed' banner to be visible (using data-testid)
    await expect(
      page.locator('[data-testid="purchase-completed-message"]'),
    ).toBeVisible({ timeout: 10000 });

    await redis.quit();
  });

  test("Checkout form is absent after completed payment and revisit", async ({
    page,
  }) => {
    const redis = new Redis({
      port: parseInt(process.env.REDIS_PORT || "6379"),
      host: process.env.REDIS_HOST,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_CA_BASE64
        ? { ca: [Buffer.from(process.env.REDIS_CA_BASE64, "base64")] }
        : undefined,
    });

    // Clear any lingering cookies from previous tests.
    await page.context().clearCookies();

    // Seed a full session directly into Redis + browser cookie jar.
    await seedSession(page, "absent@e2e.test", "Absent E2E", true, redis);

    // Step 3: Read the issued sessionToken from browser cookies
    const browserCookies = await page
      .context()
      .cookies("http://localhost:3000");
    const sessionToken = browserCookies.find(
      (c) => c.name === "sessionToken",
    )?.value;
    expect(sessionToken).toBeTruthy();

    // Step 4: Simulate Stripe checkout completing — update checkoutStatus in Redis
    const sessionDataStr = await redis.get(`session:${sessionToken}`);
    const sessionData = JSON.parse(sessionDataStr!);
    await redis.set(
      `session:${sessionToken}`,
      JSON.stringify({ ...sessionData, checkoutStatus: "completed" }),
      "EX",
      sessionData.ttl ?? 86400,
    );

    // Step 5: User revisits /landing after checkout completion.
    await page.goto("/landing");
    await expect(page).toHaveURL(/\/landing/);

    // The checkout form should NOT be present
    await expect(page.locator("form")).not.toBeVisible();
    // The completed banner/message should be visible
    await expect(
      page.locator('[data-testid="purchase-completed-message"]'),
    ).toBeVisible({ timeout: 10000 });

    await redis.quit();
  });
});
