"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Pencil } from "@/components/icons";

// Review mode: a PRReviewBot-style pass over this page. Toggling it sets
// data-review on <html>; notes are display:none until then, so they cost
// nothing and stay out of the accessibility tree by default.
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-review"] });
  return () => mo.disconnect();
};
const getSnapshot = () => document.documentElement.hasAttribute("data-review");
const getServerSnapshot = () => false;

export function ReviewBar() {
  return (
    <div className="review-bar fixed inset-x-0 bottom-5 z-50 justify-center px-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center gap-4 rounded-full bg-ink py-1.5 pr-1.5 pl-4 text-paper shadow-(--shadow-float)">
        <p className="label flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          Review mode on · scroll for notes
        </p>
        <ReviewToggle className="btn min-h-8 bg-paper px-3 text-[0.8125rem] text-ink">Exit</ReviewToggle>
      </div>
    </div>
  );
}

export function ReviewToggle({ children, className = "" }: { children?: ReactNode; className?: string }) {
  const on = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => document.documentElement.toggleAttribute("data-review")}
      className={`review-toggle group inline-flex items-center gap-2 ${className}`}
    >
      <Pencil width={14} height={14} className="transition-transform duration-(--dur-base) ease-(--ease-spring) group-hover:-rotate-12 group-aria-pressed:rotate-[-24deg]" />
      {children ?? (on ? "Exit review mode" : "Review this page")}
    </button>
  );
}
