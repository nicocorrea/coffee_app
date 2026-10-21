import { devices, expect, test } from "@playwright/test";

test("search, read the recipe, pick a drink, save and reopen offline", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("Guji natural");
  await page.getByRole("button", { name: "Dial in" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Guji Hambela Natural" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your Meraki Gen 2 recipe" })).toBeVisible();
  await expect(page.getByText("94 °C").first()).toBeVisible();

  await page.getByRole("tab", { name: /Flat white/ }).click();
  const panel = page.getByRole("tabpanel");
  await expect(panel.getByRole("heading", { name: "Flat white" })).toBeVisible();
  await expect(panel.getByText("58 °C")).toBeVisible(); // light roast: 60 − 2

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Saved" }).click();
  await expect(page.getByRole("heading", { name: "Saved coffees" })).toBeVisible();

  // Saved recipes must open without calling the API.
  await page.route("**/api/brew", (route) => route.abort());
  await page.reload();
  await page.getByRole("link", { name: /Guji Hambela Natural/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Guji Hambela Natural" })).toBeVisible();
});

test("a looked-up coffee stays on the device and reopens without researching it again", async ({ context, page }) => {
  let calls = 0;
  await context.route("**/api/brew", (route) => {
    calls++;
    return route.continue();
  });
  const recipe = (p: typeof page) => p.getByRole("heading", { level: 1, name: "Guji Hambela Natural" });

  await page.goto("/bean?q=Guji%20natural");
  await expect(recipe(page)).toBeVisible();
  await page.close();

  // A new tab starts with empty session storage, like reopening the app.
  const later = await context.newPage();
  await later.goto("/");
  const recent = later.getByRole("region", { name: "Recent lookups" });
  await recent.getByRole("link", { name: /Guji Hambela Natural/ }).click();
  await expect(recipe(later)).toBeVisible();
  await expect(later.getByText(/Looked up .* and kept on this device/)).toBeVisible();

  await later.goto("/");
  await later.getByRole("searchbox").fill("  guji NATURAL ");
  await later.getByRole("button", { name: "Dial in" }).click();
  await expect(recipe(later)).toBeVisible();
  expect(calls).toBe(1);

  await later.getByRole("button", { name: "Research again" }).click();
  await expect.poll(() => calls).toBe(2);
  await expect(recipe(later)).toBeVisible();
});

test("with reduced motion the recipe appears complete, without animating in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/bean?q=Guji");
  await expect(page.getByRole("heading", { level: 1, name: "Guji Hambela Natural" })).toBeVisible();
  const settled = () =>
    page.evaluate(() => document.getAnimations().every((a) => a.playState === "finished" || a.effect?.getTiming().iterations === Infinity));
  await expect.poll(settled).toBe(true);
  await page.getByRole("tab", { name: /Latte/ }).click();
  await expect.poll(settled).toBe(true);
  expect(await page.locator("#drink-panel > div").evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
});

test("failed research offers a retry", async ({ page }) => {
  await page.route("**/api/brew", (route) =>
    route.fulfill({ status: 502, json: { code: "upstream", message: "The research timed out." } }),
  );
  await page.goto("/bean?q=Some%20coffee");
  await expect(page.getByRole("heading", { name: "The research didn’t finish" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("a non-coffee search asks the user to refine it", async ({ page }) => {
  await page.route("**/api/brew", (route) =>
    route.fulfill({
      json: { identified: false, reason: "Pizza isn’t a coffee. Try a roaster and bag name.", query: "pizza", drinks: [] },
    }),
  );
  await page.goto("/bean?q=pizza");
  await expect(page.getByRole("heading", { name: "We couldn’t place that coffee" })).toBeVisible();
  await expect(page.getByText("Pizza isn’t a coffee.")).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveValue("pizza");
});

test("access code prompt appears on 401 and retries with the code", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/brew", async (route) => {
    calls++;
    if (route.request().headers()["x-access-code"] !== "crema") {
      return route.fulfill({ status: 401, json: { code: "access_denied", message: "Enter your access code to brew." } });
    }
    return route.continue();
  });
  await page.goto("/bean?q=Guji");
  await page.getByLabel("Access code").fill("crema");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Guji Hambela Natural" })).toBeVisible();
  expect(calls).toBe(2);
});

test("guide lists every drink and the page never scrolls sideways", async ({ page }) => {
  await page.goto("/guide");
  await expect(page.getByRole("rowheader")).toHaveCount(12);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("flavour qualities explain themselves on the recipe and in the guide", async ({ page }) => {
  await page.goto("/bean?q=Guji");
  const acidity = page.locator("details").filter({ has: page.locator("summary", { hasText: /^Acidity/ }) });
  await expect(acidity).toContainText("High, 4/5");
  await expect(acidity).toContainText("like an orange");
  await acidity.locator("summary").click();
  await expect(acidity).toContainText("(this coffee)");
  await expect(acidity).toContainText("Grind finer");

  await page.goto("/guide");
  await expect(page.getByRole("heading", { name: "Reading the flavour chart" })).toBeVisible();
  await page.locator("summary", { hasText: /^Finish$/ }).click();
  await expect(page.getByText("like good dark chocolate or red wine")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Taste it in five questions" })).toBeVisible();
  await expect(page.locator("ol > li")).toHaveCount(5);
});

test.describe("desktop", () => {
  // A laptop browser; the file's iPhone settings would otherwise apply.
  test.use({
    viewport: { width: 1440, height: 900 },
    userAgent: devices["Desktop Chrome"].userAgent,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  });

  test("uses a sidebar and never scrolls sideways", async ({ page }) => {
    for (const url of ["/", "/saved", "/guide", "/bean?q=Guji"]) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, url).toBeLessThanOrEqual(0);
    }
    const nav = await page.getByRole("navigation", { name: "Main" }).boundingBox();
    expect(nav?.x).toBe(0);
    expect(nav?.height).toBe(900);
  });

  test("keeps the recipe beside the details while they scroll", async ({ page }) => {
    await page.goto("/bean?q=Guji");
    const recipe = page.getByRole("region", { name: "Your Meraki Gen 2 recipe" });
    const flavour = page.getByRole("region", { name: "How it tastes" });
    const [r, f] = [await recipe.boundingBox(), await flavour.boundingBox()];
    expect(f!.x).toBeGreaterThan(r!.x + r!.width);

    await page.getByRole("heading", { name: "Before you brew" }).scrollIntoViewIfNeeded();
    await expect(recipe).toBeInViewport();
  });
});
