import { test as setup, expect } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("human.builds.dev@gmail.com");
  await page.getByLabel("Password").fill("JYWUkz225EPBv62");
  await page.getByRole("button", { name: /log in|sign in/i }).click();

  // Wait for redirect to dashboard after login
  await expect(page).toHaveURL("/", { timeout: 10000 });

  // Save auth state for reuse across tests
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
