import { DATA } from "@/data/resume";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** True when the link points at a host listed in DATA.offlineHosts. */
export function isOffline(href: string) {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return (DATA.offlineHosts as readonly string[]).includes(host);
  } catch {
    return false;
  }
}

export type InlinePart = { text: string; href?: string };

/** Splits "[label](url)" markdown links out of plain text. Offline links become text. */
export function parseInlineLinks(source: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of source.matchAll(re)) {
    if (m.index > last) parts.push({ text: source.slice(last, m.index) });
    parts.push(isOffline(m[2]) ? { text: m[1] } : { text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < source.length) parts.push({ text: source.slice(last) });
  return parts;
}

/** "2024-06-18" → "18 Jun 2024". Static: no "x days ago" that goes stale in a prerendered page. */
export function formatDate(date: string) {
  const d = new Date(date.includes("T") ? date : `${date}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
