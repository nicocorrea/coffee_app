import { expect, test } from "@playwright/test";

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
