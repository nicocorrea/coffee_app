/** Model-supplied source URLs, reduced to unique http(s) links labelled by host. */
export function safeSources(urls: string[]): { url: string; host: string }[] {
  const seen = new Set<string>();
  const out: { url: string; host: string }[] = [];
  for (const raw of urls) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }
    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || seen.has(parsed.href)) continue;
    seen.add(parsed.href);
    out.push({ url: parsed.href, host: parsed.hostname.replace(/^www\./, "") });
  }
  return out;
}
