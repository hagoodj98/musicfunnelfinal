import { test, expect } from "@playwright/test";

/**
 * /confirming-email — the page immediately calls /api/email-confirmation.
 * Without a valid pending-subscription in Redis it returns an error and the
 * component redirects to "/". We verify both behaviours.
 */
test.describe("Confirming email page", () => {
  test("redirects to home when there is no pending confirmation", async ({
    page,
  }) => {
    // Let the real API respond — it will say 'Pending data not found' and the
    // page will redirect to "/".
    await page.goto("/confirming-email");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 20_000,
    });
  });

  test("redirects to home when the user already has an active session (middleware blocks /landing)", async ({
    page,
  }) => {
    // The confirming-email component calls router.push("/landing"), but the
    // server-side middleware rejects that navigation and redirects to "/" with
    // a message because no valid sessionToken cookie exists in this context.
    await page.route("**/api/email-confirmation", (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: "User already has an active session",
        }),
      }),
    );
    await page.goto("/confirming-email");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 10_000,
    });
  });

  test("shows a spinner / loading state while the confirmation is in flight", async ({
    page,
  }) => {
    // Delay the response long enough to observe any loading indicator.
    await page.route("**/api/email-confirmation", async (route) => {
      await new Promise((r) => setTimeout(r, 2500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", ttl: 300 }),
      });
    });
    await page.goto("/confirming-email");
    // The page renders a CircularProgress (or equivalent) while fetching
    const spinner = page.locator('[role="progressbar"]');
    await expect(spinner).toBeVisible({ timeout: 3000 });
  });
});
