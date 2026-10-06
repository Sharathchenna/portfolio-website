"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PageState } from "@/components/command-palette";
import { toggleTheme } from "@/components/theme";
import { OPEN_EVENT, openCommandMenu, shortcutsEnabled, TOAST_EVENT, toggleOneBit, toggleReview, type SiteLinks, type View } from "@/lib/actions";
import { party } from "@/lib/fx";

// The palette UI is only downloaded the first time someone opens it.
const loadPalette = () => import("@/components/command-palette");
const CommandPalette = lazy(loadPalette);

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

const subscribeOneBit = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-one-bit"] });
  return () => mo.disconnect();
};

/**
 * Mounted once in the layout: global shortcuts (⌘K / Ctrl+K, and optional
 * single keys), the Konami code, the lazily loaded palette, toasts, and the
 * 1-bit mode filter.
 */
export function CommandMenu({ links }: { links: SiteLinks }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("commands");
  // One palette instance per opening (keyed), with the page state it opened on.
  const [session, setSession] = useState<{ n: number; env: PageState } | null>(null);
  const [message, setMessage] = useState({ text: "", id: 0 });
  const openRef = useRef(false);
  const konami = useRef(0);

  const close = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);
  const show = useCallback(async (v: View) => {
    const { readPageState } = await loadPalette();
    openRef.current = true;
    setSession((s) => ({ n: (s?.n ?? 0) + 1, env: readPageState() }));
    setView(v);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => show((e as CustomEvent<View>).detail);
    const onToast = (e: Event) => setMessage((m) => ({ text: (e as CustomEvent<string>).detail, id: m.id + 1 }));

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) close();
        else show("commands");
        return;
      }

      // Konami code: listens everywhere except while typing.
      if (!isEditable(e.target)) {
        konami.current = e.key === KONAMI[konami.current] ? konami.current + 1 : e.key === KONAMI[0] ? 1 : 0;
        if (konami.current === KONAMI.length) {
          konami.current = 0;
          toggleOneBit();
          party();
          return;
        }
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || isEditable(e.target)) return;
      if (document.querySelector("dialog[open]") || !shortcutsEnabled()) return;
      const act: Record<string, () => void> = {
        "/": () => show("commands"),
        "?": () => show("shortcuts"),
        t: () => {
          const t = document.querySelector(".theme-toggle")?.getBoundingClientRect();
          toggleTheme(t ? { x: t.left + t.width / 2, y: t.top + t.height / 2 } : undefined);
        },
        r: toggleReview,
      };
      const fn = act[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };

    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener(TOAST_EVENT, onToast);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener(TOAST_EVENT, onToast);
      window.removeEventListener("keydown", onKey);
    };
  }, [show, close]);

  useEffect(() => {
    if (!message.text) return;
    const t = window.setTimeout(() => setMessage((m) => ({ ...m, text: "" })), 2800);
    return () => clearTimeout(t);
  }, [message]);

  const oneBit = useSyncExternalStore(subscribeOneBit, () => document.documentElement.hasAttribute("data-one-bit"), () => false);

  return (
    <>
      {session && (
        <Suspense fallback={null}>
          <CommandPalette key={session.n} open={open} view={view} env={session.env} onViewChange={setView} onClose={close} links={links} />
        </Suspense>
      )}
      <div className="toast-region no-one-bit fixed inset-x-0 top-18 z-50 flex justify-center px-4 md:top-20" role="status" aria-live="polite">
        {message.text && (
          <p key={message.id} className="toast label rounded-full bg-ink px-4 py-2 text-paper shadow-(--shadow-float)">
            {message.text}
          </p>
        )}
      </div>
      {oneBit && (
        <div className="no-one-bit fixed inset-x-0 bottom-5 z-50 flex justify-center px-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex items-center gap-4 rounded-full bg-ink py-1.5 pr-1.5 pl-4 text-paper shadow-(--shadow-float)">
            <p className="label">1-bit mode</p>
            <button type="button" onClick={toggleOneBit} className="btn min-h-8 bg-paper px-3 text-[0.8125rem] text-ink">
              Exit
            </button>
          </div>
        </div>
      )}
      {oneBit && <OneBitFilter />}
    </>
  );
}

/** Preloads the palette chunk on hover/focus, so the first open is instant. */
export const preloadCommandMenu = () => void loadPalette();

const subscribeNothing = () => () => {};
const modKey = () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl ");

export function CommandMenuTrigger({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  const mod = useSyncExternalStore(subscribeNothing, modKey, () => "⌘");
  return (
    <button
      type="button"
      onClick={() => openCommandMenu()}
      onPointerEnter={preloadCommandMenu}
      onFocus={preloadCommandMenu}
      aria-label={children ? undefined : "Open command menu"}
      aria-keyshortcuts="Meta+K Control+K"
      className={className}
    >
      {children}
      <kbd className="label leading-none" aria-hidden={children ? true : undefined}>
        {mod}K
      </kbd>
    </button>
  );
}

/**
 * An ordered dither as an SVG filter: luminance, plus a tiled 8×8 Bayer
 * threshold map, quantised to one bit and mapped to the theme's two colours.
 * The threshold tile is drawn as vector rects so it stays crisp at any DPR.
 */
function OneBitFilter() {
  const tile = (() => {
    const b = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
    // Inverted thresholds (1 − t), so the composite below keeps alpha at 1.
    const rects = b
      .map((v, i) => {
        const g = Math.round((1 - (v + 0.5) / 64) * 255);
        return `<rect x='${i % 8}' y='${(i / 8) | 0}' width='1' height='1' fill='rgb(${g},${g},${g})'/>`;
      })
      .join("");
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='8' height='8' shape-rendering='crispEdges'>${rects}</svg>`)}`;
  })();
  const filter = (id: string, low: [number, number, number], high: [number, number, number]) => (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      {/* Luminance, stretched slightly so the paper itself comes out clean. */}
      <feColorMatrix type="matrix" values="0.2381 0.801 0.0809 0 0  0.2381 0.801 0.0809 0 0  0.2381 0.801 0.0809 0 0  0 0 0 1 0" result="luma" />
      <feImage href={tile} x="0" y="0" width="16" height="16" preserveAspectRatio="none" result="cell" />
      <feTile in="cell" result="threshold" />
      {/* luma + (1 − t) − 0.5: above 0.5 wherever luma beats the threshold. */}
      <feComposite in="luma" in2="threshold" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" />
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="0 1" />
        <feFuncG type="discrete" tableValues="0 1" />
        <feFuncB type="discrete" tableValues="0 1" />
      </feComponentTransfer>
      <feComponentTransfer>
        <feFuncR type="table" tableValues={`${low[0] / 255} ${high[0] / 255}`} />
        <feFuncG type="table" tableValues={`${low[1] / 255} ${high[1] / 255}`} />
        <feFuncB type="table" tableValues={`${low[2] / 255} ${high[2] / 255}`} />
      </feComponentTransfer>
      {/* Keep the source's transparency, or empty areas would turn into a checkerboard. */}
      <feComposite in2="SourceGraphic" operator="in" />
    </filter>
  );
  return (
    <svg width="0" height="0" aria-hidden focusable={false} className="no-one-bit absolute">
      {/* Accent dots on paper, like the portrait: light and dark themes. */}
      {filter("one-bit-light", [43, 53, 245], [241, 238, 231])}
      {filter("one-bit-dark", [14, 14, 13], [141, 149, 255])}
    </svg>
  );
}
