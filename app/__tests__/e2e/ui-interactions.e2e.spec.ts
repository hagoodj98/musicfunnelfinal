import { test, expect } from "@playwright/test";

/**
 * PageMessenger — the component reads a `msg` query-parameter and shows a
 * snackbar notification. It is mounted on the home page and the landing page.
 */
test.describe("PageMessenger (msg query param)", () => {
  test("shows a snackbar with the decoded message when ?msg is present", async ({
    page,
  }) => {
    const message = encodeURIComponent("Welcome back!");
    await page.goto(`/?msg=${message}`);
    await expect(page.getByText(/welcome back!/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("does not show a snackbar when no msg param is present", async ({
    page,
  }) => {
    await page.goto("/");
    // Snackbar should not be in the DOM / visible
    await expect(page.getByText(/welcome back!/i)).not.toBeVisible();
  });

  test("shows the 'You cannot proceed' message and redirects to home", async ({
    page,
  }) => {
    const message = encodeURIComponent("You cannot proceed to this page.");
    await page.goto(`/?msg=${message}`);
    await expect(page.getByText(/you cannot proceed/i)).toBeVisible({
      timeout: 5000,
    });
    // After ~3 s the component redirects to "/"
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?(\?.*)?$/, {
      timeout: 10_000,
    });
  });
});

/**
 * Cookie consent banner
 */
test.describe("Cookie consent banner", () => {
  test("displays the cookie banner on first visit", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    // Clear localStorage after page load then reload so the useEffect sees no consent
    await page.evaluate(() => localStorage.removeItem("cookieConsent"));
    await page.reload();
    // Banner is rendered via useEffect — wait for it to appear after hydration
    await expect(page.getByRole("button", { name: /understood/i })).toBeVisible(
      {
        timeout: 5000,
      },
    );
  });

  test("hides the banner after clicking 'Understood'", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("cookieConsent"));
    await page.reload();
    await page.getByRole("button", { name: /understood/i }).click();
    await expect(
      page.getByRole("button", { name: /understood/i }),
    ).not.toBeVisible();
  });

  test("does not show the banner when consent is already stored", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("cookieConsent", "true"));
    await page.reload();
    await expect(
      page.getByRole("button", { name: /understood/i }),
    ).not.toBeVisible();
  });
});
