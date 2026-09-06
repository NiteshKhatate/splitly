import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ownerEmail = process.env.E2E_USER_EMAIL;
const ownerPassword = process.env.E2E_USER_PASSWORD;
const memberEmail = process.env.E2E_MEMBER_EMAIL;
const memberPassword = process.env.E2E_MEMBER_PASSWORD;
const hasTestAccounts = Boolean(ownerEmail && ownerPassword && memberEmail && memberPassword);

async function logIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function logOut(page: import("@playwright/test").Page) {
  const response = await page.request.post("/auth/logout");
  expect(response.ok()).toBeTruthy();
  await page.goto("/login");
}

test("tablet keyboard journey covers group, member, expense, balance, settlement, and activity", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "The authenticated responsive audit runs at tablet size.");
  test.skip(!hasTestAccounts, "Dedicated non-production E2E accounts are required.");
  test.setTimeout(90_000);

  await logIn(page, ownerEmail!, ownerPassword!);
  await page.goto("/groups/new");
  await page.getByLabel("Group name").fill(`Tablet QA ${Date.now()}`);
  await page.getByRole("button", { name: "Create group" }).click();
  await expect(page).toHaveURL(/\/groups\/[0-9a-f-]+$/);
  const groupPath = new URL(page.url()).pathname;

  await page.getByRole("button", { name: /add people/i }).first().click();
  const dialog = page.getByRole("dialog", { name: "Add people" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Email address").fill(memberEmail!);
  await dialog.getByRole("button", { name: "Find person" }).click();
  await dialog.getByRole("button", { name: "Add person" }).click();
  await expect(dialog.getByRole("status")).toContainText("added to the group");
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: /add expense/i }).click();
  await page.getByLabel("Description").fill("Tablet accessibility dinner");
  await page.getByLabel("Total amount").fill("10.00");
  await page.locator('input[id^="payer-"]').first().fill("10.00");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page).toHaveURL(groupPath);
  await page.getByRole("link", { name: "Balances" }).click();
  await expect(page.getByText(/owes/).first()).toBeVisible();

  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await logOut(page);
  await logIn(page, memberEmail!, memberPassword!);
  await page.goto(`${groupPath}/balances`);
  await page.getByRole("button", { name: "Settle up" }).click();
  await expect(page.getByLabel("Amount")).toBeFocused();
  await page.getByRole("button", { name: "Record settlement" }).click();
  await expect(page.getByText("Awaiting confirmation")).toBeVisible();

  await logOut(page);
  await logIn(page, ownerEmail!, ownerPassword!);
  await page.goto(`${groupPath}/balances`);
  await page.getByRole("button", { name: "Confirm payment" }).click();
  await expect(page.getByText("Confirmed")).toBeVisible();
  await page.goto(`/activity?groupId=${groupPath.split("/").at(-1)}`);
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
