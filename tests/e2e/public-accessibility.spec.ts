import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

const responsiveViewports = {
  "desktop-chromium": [
    { height: 768, width: 1024 },
    { height: 900, width: 1440 },
  ],
  "mobile-chromium": [
    { height: 568, width: 320 },
    { height: 740, width: 360 },
    { height: 812, width: 375 },
    { height: 844, width: 390 },
    { height: 896, width: 414 },
  ],
  "tablet-chromium": [{ height: 1024, width: 768 }],
} as const;

for (const route of publicRoutes) {
  test(`${route} fits its representative responsive viewports`, async ({ page }, testInfo) => {
    const viewports = responsiveViewports[testInfo.project.name as keyof typeof responsiveViewports];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();

      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

      expect(layout.scrollWidth, `${route} should not overflow at ${viewport.width}px`).toBeLessThanOrEqual(layout.clientWidth);

      for (const control of await page.locator("a:visible, button:visible, input:visible, select:visible, textarea:visible").all()) {
        const box = await control.boundingBox();
        if (!box) continue;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(layout.clientWidth + 1);
      }
    }
  });
}

for (const route of ["/login", "/signup", "/forgot-password"]) {
  test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("invalid login is keyboard accessible and keeps entered data", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
});

test("public mobile actions have comfortable touch targets", async ({ page }) => {
  const targets = [
    { route: "/", selectors: ['a[aria-label="Splitly home"]'] },
    { route: "/login", selectors: ['a[href="/"]', 'a[href="/forgot-password"]', 'a[href="/signup"]'] },
    { route: "/signup", selectors: ['a[href="/"]', 'button[aria-controls="password"]', 'button[aria-controls="confirm-password"]', 'a[href="/login"]'] },
    { route: "/forgot-password", selectors: ['a[href="/"]', 'a[href="/login"]'] },
    { route: "/reset-password", selectors: ['a[href="/"]'] },
  ];

  await page.setViewportSize({ height: 568, width: 320 });

  for (const { route, selectors } of targets) {
    await page.goto(route);

    for (const selector of selectors) {
      const control = page.locator(selector).first();
      const box = await control.boundingBox();
      expect(box, `${route} ${selector} should be visible`).not.toBeNull();
      expect(box!.height, `${route} ${selector} should be at least 44px tall`).toBeGreaterThanOrEqual(44);
      expect(box!.width, `${route} ${selector} should be at least 44px wide`).toBeGreaterThanOrEqual(44);
    }
  }
});

test("application responses include baseline security headers", async ({ request }) => {
  const response = await request.get("/login");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
