import { expect, test } from "@playwright/test";

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
