import { expect, test } from "@playwright/test";

const loop = "section[aria-labelledby=film-heading] video[aria-hidden]";

test("the home page loops the film silently, and a tap plays the full film with captions", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "From cherry to cup" });
  await section.scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator(loop).evaluate((v: HTMLVideoElement) => !v.paused && v.muted)).toBe(true);

  await section.getByRole("button", { name: /Watch the film/ }).click();
  const film = section.locator("video[controls]");
  await expect(film).toBeVisible();
  await expect(film).toBeFocused();
  await expect(page.locator(loop)).toBeHidden();
  expect(await film.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, captions: v.textTracks[0]?.kind }))).toEqual({
    muted: false,
    captions: "captions",
  });
});

test("with reduced motion the loop stays on its poster", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("region", { name: "From cherry to cup" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  expect(await page.locator(loop).evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});
