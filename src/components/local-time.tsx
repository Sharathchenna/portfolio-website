"use client";

import { useEffect, useState } from "react";

const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

/** Local time in Hyderabad, so visitors know when a reply is likely. Ticks on the minute. */
export function LocalTime() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    let t = 0;
    const tick = () => {
      setNow(fmt.format(new Date()));
      t = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  return (
    <span className="inline-block min-w-[5ch] tabular-nums" suppressHydrationWarning>
      {now ?? "--:--"}
    </span>
  );
}
