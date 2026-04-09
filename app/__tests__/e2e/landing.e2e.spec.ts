import { test, expect } from "@playwright/test";

/**
 * /landing — protected by server-side middleware that requires a `sessionToken`
 * cookie backed by a live Redis session.  Without valid credentials every
 * navigation to /landing is redirected back to "/" with a descriptive message.
 * These tests verify that protection and the resulting user-facing behaviour.
 */
test.describe("Landing page — access protection", () => {
  test("redirects to home when no session cookie is present", async ({
    page,
  }) => {
    await page.goto("/landing");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 10_000,
    });
  });

  test("redirect includes a descriptive error message in the query string", async ({
    page,
  }) => {
    await page.goto("/landing");
    await expect(page).toHaveURL(/You%2520cannot%2520proceed/, {
      timeout: 10_000,
    });
  });

  test("error message is surfaced to the user via the PageMessenger snackbar", async ({
    page,
  }) => {
    await page.goto("/landing");
    await expect(page.getByText(/You cannot proceed/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Landing page — home-page content is intact after redirect", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/landing");
    await page.waitForURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 10_000,
    });
  });

  test("home page headline is still visible after redirect", async ({
    page,
  }) => {
    await expect(
      page.getByText(/giving away 4 of my most popular products/i),
    ).toBeVisible();
  });

  test("'Join The Family' button is still rendered", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /join the family/i }),
    ).toBeVisible();
  });
});
