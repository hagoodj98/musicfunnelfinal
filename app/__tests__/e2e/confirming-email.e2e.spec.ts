import { test, expect } from "@playwright/test";

/**
 * /processing — the page immediately calls /api/processing-webhook.
 * Without a valid pending-subscription in Redis it returns an error and the
 * component redirects to "/". We verify both behaviours.
 */
test.describe("Confirming email page", () => {
  test("redirects to home when there is no pending confirmation", async ({
    page,
  }) => {
    await page.context().clearCookies();
    // Let the real API respond — it will say 'Pending data not found' and the
    // page will redirect to "/".
    await page.goto("/processing");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 20_000,
    });
  });

  test("redirects to home when the user already has an active session (middleware blocks /landing)", async ({
    page,
  }) => {
    await page.context().clearCookies();
    // The processing component calls router.push("/landing"), but the
    // server-side middleware rejects that navigation and redirects to "/" with
    // a message because no valid sessionToken cookie exists in this context.
    await page.route("**/api/processing-webhook", (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: "User already has an active session",
        }),
      }),
    );
    await page.goto("/processing");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 10_000,
    });
  });

  test("shows a spinner / loading state while the confirmation is in flight", async ({
    page,
  }) => {
    await page.context().clearCookies();
    // Delay the response long enough to observe any loading indicator.
    await page.route("**/api/processing-webhook", async (route) => {
      await new Promise((r) => setTimeout(r, 2500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          redirectUrl: "/landing",
          sessionTTL: 300,
        }),
      });
    });
    await page.goto("/processing");
    // The page renders a CircularProgress (or equivalent) while fetching
    const spinner = page.locator('[role="progressbar"]');
    await expect(spinner).toBeVisible({ timeout: 3000 });
  });
});
