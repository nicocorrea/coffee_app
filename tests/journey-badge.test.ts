import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrast } from "@/components/journey/art/pills";

// The colours the badges are drawn with, read from the stylesheets themselves so they can't drift.
const css = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const token = (source: string, name: string) => {
  const m = source.match(new RegExp(`--color-${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`no --color-${name}`);
  return m[1].trim();
};
const badgeClass = (provenance: string) => {
  const m = css("components/journey/Badge.tsx").match(new RegExp(`${provenance}: "((?:bg-|border)[^"]*)"`));
  return m![1];
};
/** `top` at `alpha` composited over `under`, as a hex colour. */
const over = (top: string, under: string, alpha: number) =>
  "#" +
  [1, 3, 5]
    .map((i) => parseInt(top.slice(i, i + 2), 16) * alpha + parseInt(under.slice(i, i + 2), 16) * (1 - alpha))
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("");
const textToken = (cls: string) => cls.match(/\btext-([a-z0-9-]+)/)![1];

describe("provenance badges", () => {
  const theme = css("app/globals.css");

  it("the grey 'usually' badge's text reaches 4.5:1 on its background", () => {
    const cls = badgeClass("usual");
    expect(cls).toContain("bg-surface-2");
    const text = token(theme, textToken(cls));
    expect(contrast(text, token(theme, "surface-2"))).toBeGreaterThanOrEqual(4.5);
  });

  it("…and on the dark stages too", () => {
    const dark = css("components/journey/journey.css").split(".j-dark {")[1].split("}")[0];
    const text = token(dark, textToken(badgeClass("usual")));
    // surface-2 there is light paper at 12% over the dark paper.
    expect(token(dark, "surface-2")).toBe("rgb(251 248 245 / 0.12)");
    expect(contrast(text, over("#fbf8f5", token(dark, "paper"), 0.12))).toBeGreaterThanOrEqual(4.5);
  });
});
