"use client";

import { useEffect, useState } from "react";

type V = { lcp?: number; cls: number; js?: number };

/** Core Web Vitals for this visit, measured in the visitor's own browser. */
export function Vitals() {
  const [v, setV] = useState<V>({ cls: 0 });

  useEffect(() => {
    const observers: PerformanceObserver[] = [];
    const observe = (type: string, cb: (entries: PerformanceEntryList) => void) => {
      try {
        const po = new PerformanceObserver((list) => cb(list.getEntries()));
        po.observe({ type, buffered: true });
        observers.push(po);
      } catch {
        /* unsupported entry type (e.g. Safari + LCP) */
      }
    };
    observe("largest-contentful-paint", (entries) => {
      const last = entries[entries.length - 1];
      if (last) setV((s) => ({ ...s, lcp: last.startTime }));
    });
    observe("layout-shift", (entries) => {
      let add = 0;
      for (const e of entries as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) add += e.value;
      if (add) setV((s) => ({ ...s, cls: s.cls + add }));
    });
    const measureJs = () => {
      const bytes = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
        .filter((r) => r.initiatorType === "script" || r.name.endsWith(".js"))
        .reduce((n, r) => n + (r.encodedBodySize || r.transferSize || 0), 0);
      if (bytes) setV((s) => ({ ...s, js: bytes }));
    };
    if (document.readyState === "complete") measureJs();
    else window.addEventListener("load", measureJs, { once: true });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const items = [
    v.lcp !== undefined && `LCP ${(v.lcp / 1000).toFixed(2)}s`,
    `CLS ${v.cls.toFixed(3)}`,
    v.js !== undefined && `JS ${Math.round(v.js / 1024)} KB`,
  ].filter(Boolean);

  return (
    <p className="label text-ink-2">
      <span className="mr-2 inline-block size-1.5 translate-y-[-1px] rounded-full bg-accent align-middle" aria-hidden />
      This visit: <span className="text-ink">{items.join(" · ")}</span>
    </p>
  );
}
