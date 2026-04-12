import { test, expect } from "@playwright/test";

/**
 * Subscription form — modal open/close, client-side validation errors, UI states
 * Note: form submission tests stop at the validation stage; actual API calls are
 * covered by integration tests so we don't hit production infrastructure.
 */
test.describe("Subscription form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Open the modal
    await page.getByRole("button", { name: /join the family/i }).click();
  });

  test("modal opens when 'Join The Family' is clicked", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /join the family/i }),
    ).toBeVisible();
  });

  test("modal displays subtitle with instructions", async ({ page }) => {
    await expect(page.getByText(/enter your name and email/i)).toBeVisible();
  });

  test("modal contains name and email inputs", async ({ page }) => {
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("whitespace-only name is treated as empty and shows a validation error", async ({
    page,
  }) => {
    // Zod's .trim() reduces '   ' to '' which then fails .min(2)
    await page.getByLabel(/your name/i).pressSequentially("   ");
    await page.getByLabel(/email/i).pressSequentially("alice@example.com");
    await page.getByRole("button", { name: /get instant access/i }).click();
    await expect(
      page.getByRole("dialog").getByText(/name is required/i),
    ).toBeVisible();
  });

  test("email with no domain part is rejected with a validation error", async ({
    page,
  }) => {
    // "alice@" has no domain — Zod's z.email() rejects it
    await page.getByLabel(/your name/i).fill("Alice Smith");
    await page.getByLabel(/email/i).fill("alice@");
    await page.getByRole("button", { name: /get instant access/i }).click();
    await expect(
      page.getByRole("dialog").getByText(/invalid email/i),
    ).toBeVisible();
  });

  test("entering an invalid email shows an email validation error", async ({
    page,
  }) => {
    await page.getByLabel(/your name/i).fill("Alice");
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByRole("button", { name: /get instant access/i }).click();
    await expect(
      page.getByRole("dialog").getByText(/invalid email/i),
    ).toBeVisible();
  });

  test("name with invalid characters shows a validation error", async ({
    page,
  }) => {
    await page.getByLabel(/your name/i).fill("Alice123!!");
    await page.getByLabel(/email/i).fill("alice@example.com");
    await page.getByRole("button", { name: /get instant access/i }).click();
    await expect(
      page.getByRole("dialog").getByText(/letters, spaces, apostrophes/i),
    ).toBeVisible();
  });

  test("name shorter than 2 characters shows a validation error", async ({
    page,
  }) => {
    await page.getByLabel(/your name/i).fill("A");
    await page.getByLabel(/email/i).fill("alice@example.com");
    await page.getByRole("button", { name: /get instant access/i }).click();
    await expect(
      page.getByRole("dialog").getByText(/name is required/i),
    ).toBeVisible();
  });

  test("modal closes when the close button is clicked", async ({ page }) => {
    await page.getByLabel(/close modal/i).click();
    await expect(
      page.getByRole("heading", { name: /join the family/i }),
    ).not.toBeVisible();
  });

  test("valid input fills fields without errors", async ({ page }) => {
    await page.getByLabel(/your name/i).fill("Alice Smith");
    await page.getByLabel(/email/i).fill("alice@example.com");
    // No error messages yet (before submit)
    await expect(
      page.getByRole("dialog").getByText(/name is required/i),
    ).not.toBeVisible();
    await expect(
      page.getByRole("dialog").getByText(/invalid email/i),
    ).not.toBeVisible();
  });

  test("shows server-side email error returned by /api/subscribe", async ({
    page,
  }) => {
    await page.route("**/api/subscribe", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Invalid email. Please provide a valid email.",
        }),
      });
    });

    await page.getByLabel(/your name/i).fill("Alice Smith");
    await page.getByLabel(/email/i).fill("alice@example.com");
    await page.getByRole("button", { name: /get instant access/i }).click();

    await expect(
      page
        .getByRole("dialog")
        .getByText(/Invalid email\. Please provide a valid email\./i),
    ).toBeVisible();
  });

  test("shows generic server error returned by /api/subscribe", async ({
    page,
  }) => {
    await page.route("**/api/subscribe", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Database temporarily unavailable." }),
      });
    });

    await page.getByLabel(/your name/i).fill("Alice Smith");
    await page.getByLabel(/email/i).fill("alice@example.com");
    await page.getByRole("button", { name: /get instant access/i }).click();

    await expect(
      page.getByRole("dialog").getByText(/Database temporarily unavailable\./i),
    ).toBeVisible();
  });

  test("shows active-session server message in snackbar", async ({ page }) => {
    await page.route("**/api/subscribe", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "User already has an active session" }),
      });
    });

    await page.getByLabel(/your name/i).fill("Alice Smith");
    await page.getByLabel(/email/i).fill("alice@example.com");
    await page.getByRole("button", { name: /get instant access/i }).click();

    await expect(
      page.getByText(/You already have an active session!/i),
    ).toBeVisible();
  });

  test("shows FindMe server error message in snackbar", async ({ page }) => {
    await page.route("**/api/check-subscriber", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Subscriber not found in audience." }),
      });
    });

    await page.getByRole("button", { name: /already subscribed\?/i }).click();
    await page.getByLabel(/your email/i).fill("missing@example.com");
    await page.getByRole("button", { name: /find me!/i }).click();

    await expect(
      page.getByText(/Subscriber not found in audience\./i),
    ).toBeVisible();
  });
});
