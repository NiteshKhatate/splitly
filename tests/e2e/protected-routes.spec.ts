import { expect, test } from "@playwright/test";

for (const route of ["/activity", "/dashboard", "/exports/expenses.csv", "/groups", "/settings"]) {
  test(`unauthenticated ${route} access is redirected`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login\?redirectTo=/);
    await expect(page.getByRole("heading", { name: "Log in to Splitly" })).toBeVisible();
  });
}
