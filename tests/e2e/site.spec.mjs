import { expect, test } from "@playwright/test";

const destinations = [
  ["Deadly Assault", "https://da.sixthstreet.wiki/"],
  ["Shiyu Defense", "https://sd.sixthstreet.wiki/"]
];

test("publishes the integrated field brief", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Sixth Street/);
  await expect(page.getByRole("heading", { level: 1, name: /Know the fight before you queue/i })).toBeVisible();
  await expect(page.locator("#deadly-assault").getByRole("heading", { level: 2, name: "Deadly Assault" })).toBeVisible();
  await expect(page.locator("#shiyu-defense").getByRole("heading", { level: 2, name: "Shiyu Defense" })).toBeVisible();
  await expect(page.locator("#da-content")).not.toBeEmpty();
  await expect(page.locator("#sd-content")).not.toBeEmpty();
  await expect(page.locator("#da-ticker")).toContainText(/remaining/i);
  await expect(page.locator("#sd-ticker")).toContainText(/remaining/i);
  expect(errors).toEqual([]);
});

test("preserves direct access to both independent briefs", async ({ page }) => {
  await page.goto("/");
  for (const [name, href] of destinations) {
    await expect(page.getByRole("link", { name: new RegExp(`full ${name} brief`, "i") })).toHaveAttribute("href", href);
  }

  await page.goto("/home.html");
  for (const [name, href] of destinations) {
    await expect(page.getByRole("link", { name: new RegExp(`Open ${name}`, "i") })).toHaveAttribute("href", href);
  }
});

test("links to the generated Attribute Anomaly reference", async ({ page }) => {
  await page.goto("/");
  const termLink = page.getByRole("link", { name: /Attribute Anomaly/i }).first();
  await expect(termLink).toHaveAttribute("href", "terms/attribute-anomaly/");
  await termLink.click();
  await expect(page).toHaveURL(/\/terms\/attribute-anomaly\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Attribute Anomaly" })).toBeVisible();
});

test("keeps the complete brief usable at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.locator("#deadly-assault")).toBeVisible();
  await expect(page.locator("#shiyu-defense")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});

test("serves all responsive hero formats", async ({ page }) => {
  for (const [asset, type] of [
    ["/assets/hero.png", /^image\/png(?:;|$)/],
    ["/assets/hero.webp", /^image\/webp(?:;|$)/],
    ["/assets/hero-mobile.webp", /^image\/webp(?:;|$)/]
  ]) {
    const response = await page.request.get(asset);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(type);
  }
});
