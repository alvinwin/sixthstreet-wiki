import { expect, test } from "@playwright/test";

const destinations = [
  ["Deadly Assault", "https://alvinwin.github.io/zzz-deadly-assault/"],
  ["Shiyu Defense", "https://alvinwin.github.io/zzz-shiyu-defense/"]
];

test("offers both independent briefs", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Sixth Street/);
  await expect(page.locator('input[type="search"]:not(:disabled):not([aria-disabled="true"]), [role="searchbox"]:not(:disabled):not([aria-disabled="true"])')).toHaveCount(0);

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

test("serves responsive hero assets as WebP", async ({ page }) => {
  for (const asset of ["/assets/hero.webp", "/assets/hero-mobile.webp"]) {
    const response = await page.request.get(asset);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\/webp(?:;|$)/);
  }
});

test("keeps the notice board informational and ordered", async ({ page }) => {
  await page.goto("/");

  const ticker = page.locator("aside.resource-ticker");
  const rows = ticker.locator(".ticker-items > li");
  await expect(rows).toHaveCount(3);
  await expect(rows.locator("a")).toHaveCount(0);

  for (const [index, label] of ["Deadly Assault", "Shiyu Defense"].entries()) {
    await expect(rows.nth(index)).toBeVisible();
    await expect(rows.nth(index)).toHaveText(new RegExp(`^${label}\\s*Available below$`));
  }
});

test("keeps the source label link anchored to its terms", async ({ page }) => {
  await page.goto("/");

  const sourcePanel = page.locator(".source-editorial");
  await expect(sourcePanel.getByRole("link", { name: "Read the label" })).toHaveAttribute("href", "#source-terms");
});

test("loads only the mobile hero asset at narrow navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const assetRequests = [];
  page.on("request", (request) => {
    if (request.resourceType() !== "image") return;
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/assets/hero.webp" || pathname === "/assets/hero-mobile.webp") {
      assetRequests.push(pathname);
    }
  });

  await page.goto("/", { waitUntil: "networkidle" });

  expect(assetRequests).toContain("/assets/hero-mobile.webp");
  expect(assetRequests).not.toContain("/assets/hero.webp");
});
