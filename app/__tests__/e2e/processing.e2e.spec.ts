import { test, expect, Page } from "@playwright/test";
import Redis from "ioredis";

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

async function seedMinimalSession(page: Page) {
  const redis = createRedisClient();
  const sessionToken = `processing-e2e-${Date.now()}`;
  const csrfToken = `csrf-${Date.now()}`;

  await redis.set(
    `session:${sessionToken}`,
    JSON.stringify({
      email: "processing@e2e.test",
      name: "Processing E2E",
      status: "subscribed",
      rememberMe: true,
      csrfToken,
      checkoutStatus: "completed",
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

  await redis.quit();
}

async function forceImmediateProcessingRedirect(page: Page) {
  await page.addInitScript(() => {
    const originalSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) => {
      const normalizedTimeout = timeout === 5000 ? 0 : timeout;
      return originalSetTimeout(handler, normalizedTimeout, ...args);
    }) as typeof window.setTimeout;
  });
}

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

test.describe("Processing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("shows purchase-processing copy for checkout redirect", async ({
    page,
  }) => {
    await page.route(
      "**/api/processing-webhook?session_id=*",
      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, redirectUrl: "/" }),
        });
      },
    );

    await page.goto("/processing?session_id=cs_test_processing");
    await expect(
      page.getByText(
        /Processing your purchase confirmation|Purchase confirmed! Redirecting/i,
      ),
    ).toBeVisible();
  });

  test("shows checkout success state after webhook processing response", async ({
    page,
  }) => {
    await seedMinimalSession(page);

    await page.route(
      "**/api/processing-webhook?session_id=*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            redirectUrl: "/landing/thankyou",
            sessionTTL: 600,
          }),
        });
      },
    );

    await page.goto("/processing?session_id=cs_test_success");

    await expect(
      page.getByText(/Purchase confirmed! Redirecting/i),
    ).toBeVisible();
  });

  test("navigates to thank-you from checkout return-url when processing succeeds", async ({
    page,
  }) => {
    await seedMinimalSession(page);
    await forceImmediateProcessingRedirect(page);

    await page.route(
      "**/api/processing-webhook?session_id=*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            redirectUrl: "/landing/thankyou",
            sessionTTL: 600,
          }),
        });
      },
    );

    await page.goto("/processing?session_id=cs_test_redirect");

    await expect(page).toHaveURL(/\/landing\/thankyou/, {
      timeout: 10_000,
    });
    await expect(
      page.getByRole("heading", { name: /Thank You For Your Support/i }),
    ).toBeVisible();
  });

  test("shows unauthorized message when checkout verification fails", async ({
    page,
  }) => {
    await page.route(
      "**/api/processing-webhook?session_id=*",
      async (route) => {
        await route.fulfill({
          status: 402,
          contentType: "application/json",
          body: JSON.stringify({ error: "Payment not completed" }),
        });
      },
    );

    await page.goto("/processing?session_id=cs_test_unpaid");

    await expect(
      page.getByText(/Unauthorized access\. Redirecting to homepage\./i),
    ).toBeVisible();
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 8_000,
    });
  });

  test("shows email-verification error when pending data is missing", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.route("**/api/processing-webhook", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Pending data not found" }),
      });
    });

    await page.goto("/processing");

    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 8_000,
    });
  });

  test("shows server error text on the page before redirect", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = ((
        handler: TimerHandler,
        timeout?: number,
        ...args: unknown[]
      ) => {
        // Keep the user on /processing so we can assert error text visibility.
        if (timeout === 2000) {
          return 0 as unknown as number;
        }
        return originalSetTimeout(handler, timeout, ...args);
      }) as typeof window.setTimeout;
    });

    await page.route("**/api/processing-webhook", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await page.goto("/processing");

    await expect(
      page.getByText(/Unauthorized access\. Redirecting to homepage\./i),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/processing/);
  });

  test("uses real processing-webhook path for mailchimp confirmation", async ({
    page,
    browserName,
  }) => {
    await seedPendingSubscription(
      page,
      `processing-real-${Date.now()}@e2e.test`,
      "Processing Real",
      true,
    );

    await page.goto("/processing");

    await expect(
      page.getByText(
        /Processing your email confirmation|Email subscription confirmed! Redirecting/i,
      ),
    ).toBeVisible();

    if (browserName !== "webkit") {
      await expect(page).toHaveURL(/\/landing/, {
        timeout: 12_000,
      });
    }
  });
});
