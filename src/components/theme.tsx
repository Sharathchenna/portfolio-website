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

type PaintWorklet = { addModule(url: string): Promise<void> };
let worklet: Promise<boolean> | null = null;

/** Loads the dithered-wipe paint worklet once; resolves false where CSS Paint isn't supported. */
function loadDitherWipe() {
  const paint = (CSS as unknown as { paintWorklet?: PaintWorklet }).paintWorklet;
  if (!paint) return Promise.resolve(false);
  worklet ??= paint.addModule("/worklets/dither-wipe.js").then(
    () => true,
    () => false,
  );
  return worklet;
}

/**
 * Switches theme. The new theme is revealed from `origin` (viewport px) by a
 * view transition: a Bayer-dithered circle where CSS Paint is supported, a
 * plain circle elsewhere, and an instant switch under reduced motion.
 */
export async function toggleTheme(origin?: { x: number; y: number }) {
  const next = !isDark();
  const commit = () => {
    apply(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    commit();
    return;
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const x = origin?.x ?? w / 2;
  const y = origin?.y ?? h / 2;
  const band = Math.round(Math.max(120, Math.min(w, h) * 0.24));
  const end = Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + band;
  const dithered = await loadDitherWipe();

  const root = document.documentElement;
  root.style.setProperty("--vt-x", `${x}px`);
  root.style.setProperty("--vt-y", `${y}px`);
  root.style.setProperty("--vt-band", `${band}px`);
  root.style.setProperty("--vt-end", `${end}px`);
  root.dataset.themeWipe = dithered ? "dither" : "circle";
  const transition = document.startViewTransition(commit);
  transition.finished.finally(() => delete root.dataset.themeWipe);
}

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

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      onPointerEnter={loadDitherWipe}
      onFocus={loadDitherWipe}
      aria-label={dark === null ? "Toggle colour theme" : `Switch to ${dark ? "light" : "dark"} theme`}
      className={`theme-toggle relative grid size-10 place-items-center rounded-full text-ink transition-colors duration-(--dur-fast) hover:bg-paper-2 ${className}`}
    >
      <Sun className="theme-icon theme-icon-sun col-start-1 row-start-1" width={18} height={18} />
      <Moon className="theme-icon theme-icon-moon col-start-1 row-start-1" width={18} height={18} />
    </button>
  );
}
