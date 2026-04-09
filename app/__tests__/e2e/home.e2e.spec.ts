import { test, expect } from "@playwright/test";

/**
 * Home page — page load, critical content, footer
 */
test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has the correct document title", async ({ page }) => {
    await expect(page).toHaveTitle(/home/i);
  });

  test("renders the main headline", async ({ page }) => {
    await expect(
      page.getByText(/giving away 4 of my most popular products/i),
    ).toBeVisible();
  });

  test("renders the 'absolutely free' call-to-action text", async ({
    page,
  }) => {
    await expect(page.getByText(/absolutely free/i).first()).toBeVisible();
  });

  test("renders the 'Join The Family' button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /join the family/i }),
    ).toBeVisible();
  });

  test("renders the artist bio section", async ({ page }) => {
    await expect(page.getByText(/singer-songwriter/i)).toBeVisible();
  });

  test("renders a video element", async ({ page }) => {
    await expect(page.locator("video").first()).toBeAttached();
  });

  test("renders the footer with artist handle", async ({ page }) => {
    await expect(page.getByText(/@JH Studios/i)).toBeVisible();
  });

  test("footer shows the current year", async ({ page }) => {
    const year = new Date().getFullYear().toString();
    await expect(page.getByText(new RegExp(year)).first()).toBeVisible();
  });

  test("renders the HearNow button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /listen on hearnow/i }),
    ).toBeVisible();
  });
});
