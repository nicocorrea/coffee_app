import { devices, expect, test, type Page } from "@playwright/test";

test("the coffee page offers the journey", async ({ page }) => {
  await page.goto("/bean?q=Guji");
  await page.getByRole("link", { name: "Discover its journey" }).first().click();
  await expect(page).toHaveURL(/\/journey\?q=Guji/);
});

test("researches the journey once in the background for a roaster's coffee", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/journey", (r) => {
    calls++;
    return r.continue();
  });
  await page.goto("/bean?q=Guji");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(calls).toBe(0); // demo coffee has no roaster
  await page.evaluate(() => {
    const l = JSON.parse(localStorage.getItem("crema:lookups")!);
    l[0].result.bean.roaster = "Demo Roasters";
    localStorage.setItem("crema:lookups", JSON.stringify(l));
  });
  await page.reload();
  await expect.poll(() => calls).toBe(1);
  await expect
    .poll(() => page.evaluate(() => !!JSON.parse(localStorage.getItem("crema:lookups")!)[0].result.journey))
    .toBe(true);
  await page.reload();
  await page.waitForTimeout(500);
  expect(calls).toBe(1);
});

// The journey only reads what is already on the device, so each test looks the coffee up first.
async function seed(page: Page) {
  await page.goto("/bean?q=Guji");
  await expect(page.getByRole("heading", { level: 1, name: "Guji Hambela Natural" })).toBeVisible();
}

const settled = (page: Page) =>
  page.evaluate(() =>
    document.getAnimations().every((a) => a.playState === "finished" || a.effect?.getTiming().iterations === Infinity),
  );

const noSideways = (page: Page) =>
  page.evaluate(() => {
    const scrollers = [document.documentElement, ...document.querySelectorAll<HTMLElement>("[data-journey]")];
    return Math.max(...scrollers.map((e) => e.scrollWidth - e.clientWidth));
  });

test("walks the journey and returns to the recipe", async ({ page }) => {
  await seed(page);
  await page.goto("/journey?q=Guji");
  await expect(page.getByRole("heading", { name: "Guji Hambela Natural" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  await expect(page).toHaveTitle(/Journey/);
  expect(await noSideways(page)).toBeLessThanOrEqual(0);
  await page.getByRole("heading", { name: /yours/ }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Back to the recipe" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Guji Hambela Natural" })).toBeVisible();
  await expect(page).toHaveURL(/\/bean\?q=Guji/);
});

test("labels facts honestly", async ({ page }) => {
  await seed(page);
  await page.goto("/journey?q=Guji");
  const processed = page.getByRole("region", { name: /Dried whole/ });
  await expect(processed.locator('[data-provenance="own"]', { hasText: "Natural" })).toBeVisible();
  await expect(page.locator('[data-provenance="advice"]', { hasText: "10–21" })).toHaveCount(1);
  await expect(page.locator('[data-art="shipped"][data-placeholder]')).toHaveCount(1);
});

test("art adapts to the coffee", async ({ page }) => {
  await seed(page);
  await page.goto("/journey?q=Guji");
  await expect(page.locator('[data-art="cover"]')).toHaveAttribute("data-variant", "country");
  await expect(page.locator('[data-art="grown"]')).toHaveAttribute("data-variant", "peak-4 forest");
  await expect(page.locator('[data-art="picked"]')).toHaveAttribute("data-variant", "hand");
  await page.evaluate(() => {
    const l = JSON.parse(localStorage.getItem("crema:lookups")!);
    Object.assign(l[0].result.bean, { origin: "Brazil", altitude: "900 m", process: "Natural" });
    localStorage.setItem("crema:lookups", JSON.stringify(l));
  });
  await page.reload();
  await expect(page.locator('[data-art="grown"]')).toHaveAttribute("data-variant", "peak-1 sun");
  await expect(page.locator('[data-art="picked"]')).toHaveAttribute("data-variant", "machine");
});

test("the processing scenes follow the process, the drying and the milling", async ({ page }) => {
  const patch = (bean: Record<string, string>) =>
    page.evaluate((b) => {
      const l = JSON.parse(localStorage.getItem("crema:lookups")!);
      Object.assign(l[0].result.bean, b);
      localStorage.setItem("crema:lookups", JSON.stringify(l));
    }, bean);
  await seed(page);
  await page.goto("/journey?q=Guji");
  const processed = page.locator('[data-art="processed"]');
  await expect(processed).toHaveAttribute("data-variant", "natural raised-beds");
  await expect(page.locator('[data-art="milled"]')).toHaveAttribute("data-variant", "dry");
  await expect(page.locator('[data-art="sorted"]')).toHaveCount(1);
  expect(await page.locator('[data-art="sorted"]').getAttribute("data-variant")).toBeFalsy();
  await patch({ process: "Washed" });
  await page.reload();
  await expect(processed).toHaveAttribute("data-variant", "washed raised-beds");
  await patch({ origin: "Brazil", process: "Natural" });
  await page.reload();
  await expect(processed).toHaveAttribute("data-variant", "natural patio");
  await patch({ origin: "Indonesia", process: "Wet-hulled" });
  await page.reload();
  await expect(processed).toHaveAttribute("data-variant", "wet-hulled patio");
  await expect(page.locator('[data-art="milled"]')).toHaveAttribute("data-variant", "wet-hulled");
});

test("compares processes without changing the coffee", async ({ page }) => {
  await seed(page);
  await page.goto("/journey?q=Guji");
  const processed = page.getByRole("region", { name: /Dried whole/ });
  await processed.scrollIntoViewIfNeeded();
  await expect(processed.getByRole("button", { name: "Natural · yours" })).toHaveAttribute("aria-pressed", "true");
  await processed.getByRole("button", { name: "Washed" }).click();
  await expect(processed.getByRole("button", { name: "Washed" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Not this coffee, just to compare.")).toBeVisible();
  await expect(processed.locator('[data-art="processed"]')).toHaveCount(1);
  await processed.getByRole("button", { name: "Natural · yours" }).click();
  await expect(page.getByText("Not this coffee, just to compare.")).toHaveCount(0);
});

test("says when the coffee isn't on the device and never researches it", async ({ page }) => {
  let brews = 0;
  await page.route("**/api/brew", (r) => {
    brews++;
    return r.abort();
  });
  await page.goto("/journey?q=Something%20else");
  await expect(page.getByRole("heading", { name: "This coffee isn’t on this device" })).toBeVisible();
  await expect(page.getByText("Search for it again to see its journey.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to search" })).toHaveAttribute("href", "/");
  expect(brews).toBe(0);
});

test("opens a saved coffee and closes back to it", async ({ page }) => {
  await seed(page);
  await page.getByRole("button", { name: "Save" }).click();
  const key = encodeURIComponent("|guji hambela natural");
  await page.goto(`/journey?saved=${key}`);
  await expect(page.getByRole("heading", { name: "Guji Hambela Natural" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(new RegExp(`/bean\\?saved=${key}`));
  await expect(page.getByRole("heading", { level: 1, name: "Guji Hambela Natural" })).toBeVisible();
});

test("with reduced motion every stage is already finished", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  await page.goto("/journey?q=Guji");
  await expect(page.getByRole("heading", { name: "Guji Hambela Natural" })).toBeVisible();
  await expect.poll(() => settled(page)).toBe(true);
  const sections = page.locator("section[aria-labelledby]");
  await expect(sections).toHaveCount(10);
  for (const section of await sections.all()) {
    await section.scrollIntoViewIfNeeded();
    await expect.poll(() => settled(page)).toBe(true);
    const hidden = await section.evaluate((s) =>
      [...s.querySelectorAll(".j-fade, .j-rise, .j-pop, .j-grow")].filter((e) => {
        if (e.getClientRects().length === 0) return false; // not shown in this layout
        const { opacity, transform } = getComputedStyle(e);
        return opacity !== "1" || !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(transform);
      }).length,
    );
    expect(hidden).toBe(0);
  }
});

test("a stage replays when you come back to it and stops once it's off-screen", async ({ page }) => {
  await seed(page);
  await page.goto("/journey?q=Guji");
  await expect(page.getByRole("heading", { name: "Guji Hambela Natural" })).toBeVisible();
  const sections = page.locator("section[data-stage-index]");
  const show = async (i: number) => {
    await sections.nth(i).evaluate((s) => s.scrollIntoView({ block: "start" }));
    await expect(sections.nth(i)).toHaveClass(/is-active/);
  };
  await show(2);
  await expect(sections.nth(2)).toHaveAttribute("data-run", "1");
  await show(4);
  // Its neighbours sit exactly edge to edge with the screen: that counts as out of view.
  await expect(sections.nth(2)).not.toHaveClass(/is-active/);
  await expect(sections.nth(3)).not.toHaveClass(/is-active/);
  await show(2);
  await expect(sections.nth(2)).toHaveAttribute("data-run", "2");
  await expect(sections.nth(4)).not.toHaveClass(/is-active/);
  await expect(sections.nth(0)).not.toHaveClass(/is-active/);
  // One screen at a time: the stage just left ends exactly at the screen's edge.
  await show(3);
  await expect(sections.nth(2)).not.toHaveClass(/is-active/);
  await show(2);
  await expect(sections.nth(2)).toHaveAttribute("data-run", "3");
  await expect(sections.nth(3)).not.toHaveClass(/is-active/);
});

test.describe("desktop", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    userAgent: devices["Desktop Chrome"].userAgent,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  });

  test("jumps between stages from the stage bar and the keyboard", async ({ page }) => {
    await seed(page);
    await page.goto("/journey?q=Guji");
    const nav = page.getByRole("navigation", { name: "Journey stages" });
    await expect(nav.getByRole("button")).toHaveCount(10);
    await expect(page.getByRole("button", { name: /Recipe · Guji Hambela Natural/ })).toBeVisible();
    expect(await noSideways(page)).toBeLessThanOrEqual(0);
    await nav.getByRole("button", { name: "Roasted" }).click();
    await expect(page.getByRole("heading", { name: /tasting like coffee/ })).toBeInViewport();
    await expect(nav.getByRole("button", { name: "Roasted" })).toHaveAttribute("aria-current", "step");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("heading", { name: /breathe/ })).toBeInViewport();
    await expect(nav.getByRole("button", { name: "Rested" })).toHaveAttribute("aria-current", "step");
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/bean\?q=Guji/);
    await expect(page.getByRole("heading", { level: 1, name: "Guji Hambela Natural" })).toBeVisible();
  });

  test("pins one 6:5 illustration and cross-fades to the active stage", async ({ page }) => {
    await seed(page);
    await page.goto("/journey?q=Guji");
    const card = page.locator("[data-stage-card]");
    const box = (await card.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(1.2, 1);
    expect(box.x + box.width).toBeLessThan(1440 / 2 + 200);
    await expect(card.locator('[data-art-frame].is-on [data-art="cover"]')).toHaveCount(1);
    await page.getByRole("navigation", { name: "Journey stages" }).getByRole("button", { name: "Processed" }).click();
    await expect(card.locator('[data-art-frame].is-on [data-art="processed"]')).toHaveCount(1);
    await expect(card).toBeInViewport();
  });
});
