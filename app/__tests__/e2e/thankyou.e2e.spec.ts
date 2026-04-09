import { test, expect } from "@playwright/test";

/**
 * /landing/thankyou — protected by middleware (sessionToken + CSRF check).
 * Without a valid session every navigation is redirected to "/" with a message.
 */
test.describe("Thank you page — access protection", () => {
  test("redirects to home when there is no valid session", async ({ page }) => {
    await page.goto("/landing/thankyou");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 10_000,
    });
  });

  test("redirect carries the 'You cannot proceed' error message", async ({
    page,
  }) => {
    await page.goto("/landing/thankyou");
    await expect(page).toHaveURL(/You%2520cannot%2520proceed/, {
      timeout: 10_000,
    });
  });

  test("error message is shown to the user via PageMessenger on the home page", async ({
    page,
  }) => {
    await page.goto("/landing/thankyou");
    await expect(page.getByText(/You cannot proceed/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
