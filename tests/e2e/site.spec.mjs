import { expect, test } from "@playwright/test";

const destinations = [
  ["Deadly Assault", "https://alvinwin.github.io/zzz-deadly-assault/"],
  ["Shiyu Defense", "https://alvinwin.github.io/zzz-shiyu-defense/"]
];

test("offers both independent briefs", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Sixth Street/);

  for (const [name, href] of destinations) {
    const link = page.getByRole("link", { name: new RegExp(name, "i") });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).not.toHaveAttribute("target");
  }
});

test("keeps the mobile surface compact and keyboard-visible", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});
