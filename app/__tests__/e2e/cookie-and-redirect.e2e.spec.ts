import { test, expect, Page } from "@playwright/test";
import Redis from "ioredis";

/**
 * WebKit drops Set-Cookie headers from 302 redirect responses before following them.
 * This helper calls mailchimp-flow without following the redirect, extracts the
 * pendingSubscription cookie from the response headers, and sets it manually so
 * the subsequent /api/email-confirmation request receives it correctly.
 */
async function seedPendingSubscription(
  page: Page,
  email: string,
  name: string,
  rememberMe = true,
) {
  const response = await page.request.get(
    `/api/mailchimp-flow?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&rememberMe=${rememberMe}`,
    { maxRedirects: 0, failOnStatusCode: false },
  );
  const setCookie = response.headers()["set-cookie"] ?? "";
  const match = setCookie.match(/pendingSubscription=([^;]+)/);
  if (match) {
    await page.context().addCookies([
      {
        name: "pendingSubscription",
        value: match[1],
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);
  }
}

/**
 * Seeds a full authenticated session (sessionToken + csrfToken) into the browser
 * context by running through the mailchimp-flow → email-confirmation sequence.
 *
 * WebKit does NOT persist Set-Cookie headers from page.goto() responses for JSON
 * endpoints, and cookies stored by page.request are not sent on subsequent browser
 * navigations. Both cookies are extracted from response headers and explicitly
 * injected via addCookies() so the browser engine's cookie jar is populated.
 */
async function seedSession(
  page: Page,
  email: string,
  name: string,
  rememberMe = true,
) {
  await seedPendingSubscription(page, email, name, rememberMe);

  const confirmResp = await page.request.get("/api/email-confirmation", {
    failOnStatusCode: false,
  });
  const setCookieHeader = confirmResp.headers()["set-cookie"] ?? "";

  const sessionMatch = setCookieHeader.match(/sessionToken=([^;]+)/);
  const csrfMatch = setCookieHeader.match(/csrfToken=([^;]+)/);

  const cookiesToAdd: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Lax" | "Strict" | "None";
  }> = [];
  if (sessionMatch) {
    cookiesToAdd.push({
      name: "sessionToken",
      value: sessionMatch[1],
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });
  }
  if (csrfMatch) {
    cookiesToAdd.push({
      name: "csrfToken",
      value: csrfMatch[1],
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });
  }
  if (cookiesToAdd.length > 0) {
    await page.context().addCookies(cookiesToAdd);
  }
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

    // Clear any lingering cookies so assertNoActiveSession doesn't block email-confirmation
    await page.context().clearCookies();

    // Steps 1+2: Seed full session via mailchimp-flow → email-confirmation.
    // seedSession manually injects cookies via addCookies so WebKit's browser engine
    // sends them on subsequent page.goto() navigation requests.
    await seedSession(page, "returns@e2e.test", "Returns E2E", true);

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

    // Step 5: Visit /landing/thankyou — middleware checks sessionToken, csrfToken match,
    // and checkoutStatus === "completed"
    await page.goto("/landing/thankyou");
    await expect(page).toHaveURL(/\/landing\/thankyou/);
    // Wait for SessionManagerProvider's /api/session-info fetch to settle.
    // Without this, WebKit throws "navigation interrupted" when the in-flight
    // fetchTTL callback calls router.push("/") concurrently with the next goto.
    await page.waitForLoadState("networkidle");

    // Step 6: Navigate back to landing
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

    // Clear any lingering cookies so assertNoActiveSession doesn't block email-confirmation
    await page.context().clearCookies();

    // Steps 1+2: Seed full session via mailchimp-flow → email-confirmation.
    // seedSession manually injects cookies via addCookies so WebKit's browser engine
    // sends them on subsequent page.goto() navigation requests.
    await seedSession(page, "banner@e2e.test", "Banner E2E", true);

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

    // Clear any lingering cookies so assertNoActiveSession doesn't block email-confirmation
    await page.context().clearCookies();

    // Steps 1+2: Seed full session via mailchimp-flow → email-confirmation.
    // seedSession manually injects cookies via addCookies so WebKit's browser engine
    // sends them on subsequent page.goto() navigation requests.
    await seedSession(page, "bypass@e2e.test", "Bypass E2E", true);

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

    // Clear any lingering cookies so assertNoActiveSession doesn't block email-confirmation
    await page.context().clearCookies();

    // Steps 1+2: Seed full session via mailchimp-flow → email-confirmation.
    // seedSession manually injects cookies via addCookies so WebKit's browser engine
    // sends them on subsequent page.goto() navigation requests.
    await seedSession(page, "absent@e2e.test", "Absent E2E", true);

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

    // Step 5: Visit /landing/thankyou — middleware allows through (CSRF tokens match,
    // checkoutStatus === "completed")
    await page.goto("/landing/thankyou");
    await expect(page).toHaveURL(/\/landing\/thankyou/);
    // Wait for SessionManagerProvider's /api/session-info fetch to settle.
    // Without this, WebKit throws "navigation interrupted" when the in-flight
    // fetchTTL callback calls router.push("/") concurrently with the next goto.
    await page.waitForLoadState("networkidle");

    // Step 6: User revisits /landing
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
