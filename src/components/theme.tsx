"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "@/components/icons";

const THEME_COLOR = { light: "#f1eee7", dark: "#0e0e0d" };

/**
 * Runs before first paint: applies the stored theme (or the OS preference) and
 * marks the document as JS-enabled so progressive enhancements can opt in.
 */
export const themeScript = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':matchMedia('(prefers-color-scheme: dark)').matches;var e=document.documentElement;e.classList.toggle('dark',d);e.classList.add('js');var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=d?'${THEME_COLOR.dark}':'${THEME_COLOR.light}'}catch(_){}})()`;

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? THEME_COLOR.dark : THEME_COLOR.light);
}

// The <html> class is the single source of truth; components subscribe to it.
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
};
const isDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore<boolean | null>(subscribe, isDark, () => null);

  useEffect(() => {
    // Follow the OS while the visitor hasn't picked a theme themselves.
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) apply(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = !isDark();
    const commit = () => {
      apply(next);
      localStorage.setItem("theme", next ? "dark" : "light");
    };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduce) document.startViewTransition(commit);
    else commit();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark === null ? "Toggle colour theme" : `Switch to ${dark ? "light" : "dark"} theme`}
      className={`theme-toggle relative grid size-10 place-items-center rounded-full text-ink transition-colors duration-(--dur-fast) hover:bg-paper-2 ${className}`}
    >
      <Sun className="theme-icon theme-icon-sun col-start-1 row-start-1" width={18} height={18} />
      <Moon className="theme-icon theme-icon-moon col-start-1 row-start-1" width={18} height={18} />
    </button>
  );
}
