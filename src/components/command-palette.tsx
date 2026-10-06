"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Copy, GitHub, Keyboard, LinkedIn, Mail, Moon, Pencil, Search, Sun, X } from "@/components/icons";
import { Mark } from "@/components/mark";
import { toggleTheme } from "@/components/theme";
import {
  scatterPortrait,
  setShortcutsEnabled,
  shortcutsEnabled,
  toast,
  toggleOneBit,
  toggleReview,
  type SiteLinks,
  type View,
} from "@/lib/actions";
import { burst, party } from "@/lib/fx";

type Group = "Go to" | "Actions" | "Elsewhere" | "Secret";
type Point = { x: number; y: number };
type Command = {
  id: string;
  group: Group;
  title: string;
  hint?: string;
  keywords?: string;
  icon: ReactNode;
  /** Secret commands only appear when the query matches one of these. */
  triggers?: string[];
  /** Runs after the dialog closes; `at` is where the chosen row was. */
  run: (at: Point) => void;
  keepOpen?: boolean;
};

const GROUPS: Group[] = ["Go to", "Actions", "Elsewhere", "Secret"];
const SOCIAL_ICONS: Record<string, ReactNode> = { GitHub: <GitHub />, LinkedIn: <LinkedIn />, X: <X /> };

const SHORTCUTS: { keys: string[]; label: string; single?: boolean }[] = [
  { keys: ["⌘", "K"], label: "Open the command menu (Ctrl K on Windows and Linux)" },
  { keys: ["/"], label: "Open the command menu", single: true },
  { keys: ["?"], label: "Show these shortcuts", single: true },
  { keys: ["T"], label: "Switch theme", single: true },
  { keys: ["R"], label: "Toggle review mode", single: true },
  { keys: ["↑", "↑", "↓", "↓", "←", "→", "←", "→", "B", "A"], label: "You'll see" },
];

/** Runs `cb` once an element exists, e.g. after navigating to another page. */
function whenElement<T extends Element>(selector: string, cb: (el: T) => void, tries = 60) {
  const el = document.querySelector<T>(selector);
  if (el) cb(el);
  else if (tries > 0) window.setTimeout(() => whenElement(selector, cb, tries - 1), 50);
}

function score(c: Command, q: string) {
  if (c.triggers) return c.triggers.some((t) => t === q || (q.length >= 3 && (t.startsWith(q) || q.startsWith(t)))) ? 50 : -1;
  if (!q) return 1;
  const title = c.title.toLowerCase();
  if (title.startsWith(q)) return 100;
  if (title.includes(q)) return 80;
  const hay = `${title} ${c.keywords ?? ""} ${c.group}`.toLowerCase();
  if (q.split(/\s+/).every((w) => hay.includes(w))) return 60;
  // Loose subsequence match on the title ("dk thm" → "Switch to dark theme").
  let i = 0;
  for (const ch of title) if (ch === q[i]) i++;
  return i === q.length ? 20 : -1;
}

/** Page state captured when the menu opens. */
export type PageState = { dark: boolean; review: boolean; oneBit: boolean; portrait: boolean };

export function readPageState(): PageState {
  const html = document.documentElement;
  return {
    dark: html.classList.contains("dark"),
    review: html.hasAttribute("data-review"),
    oneBit: html.hasAttribute("data-one-bit"),
    portrait: !!document.querySelector('.portrait[data-ready="true"]') && !matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

export default function CommandPalette({
  open,
  view,
  env,
  onViewChange,
  onClose,
  links,
}: {
  open: boolean;
  view: View;
  env: PageState;
  onViewChange: (v: View) => void;
  onClose: () => void;
  links: SiteLinks;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [singleKeys, setSingleKeys] = useState(shortcutsEnabled);

  // Remounted (keyed) for every opening, so state starts fresh each time.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (view === "commands") inputRef.current?.focus();
    else dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [open, view]);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    const external = (url: string) => () => window.open(url, "_blank", "noopener");
    const list: Command[] = [
      { id: "home", group: "Go to", title: "Home", icon: <ArrowRight />, run: go("/") },
      { id: "work", group: "Go to", title: "Work", keywords: "projects portfolio macrobalance prreviewbot animator", icon: <ArrowRight />, run: go("/#work") },
      { id: "about", group: "Go to", title: "About", keywords: "experience education skills toolbox", icon: <ArrowRight />, run: go("/#about") },
      { id: "contact", group: "Go to", title: "Contact", keywords: "email message hire", icon: <ArrowRight />, run: go("/#contact") },
      { id: "blog", group: "Go to", title: "Writing", keywords: "blog posts articles", icon: <ArrowRight />, run: go("/blog") },
      { id: "resume-page", group: "Go to", title: "Résumé (web page)", keywords: "resume cv", icon: <ArrowRight />, run: go("/resume") },

      {
        id: "copy-email",
        group: "Actions",
        title: "Copy email address",
        hint: links.email,
        keywords: "mail contact clipboard",
        icon: <Copy />,
        run: async (at) => {
          try {
            await navigator.clipboard.writeText(links.email);
            toast("Email address copied");
            burst(at.x, at.y);
          } catch {
            window.location.href = `mailto:${links.email}`;
          }
        },
      },
      { id: "resume", group: "Actions", title: "Open résumé PDF", keywords: "resume cv download", icon: <ArrowUpRight />, run: external(links.resume) },
      {
        id: "theme",
        group: "Actions",
        title: env.dark ? "Switch to light theme" : "Switch to dark theme",
        hint: "T",
        keywords: "theme colour color mode appearance",
        icon: env.dark ? <Sun /> : <Moon />,
        run: (at) => toggleTheme(at),
      },
      {
        id: "review",
        group: "Actions",
        title: env.review ? "Turn off review mode" : "Turn on review mode",
        hint: "R",
        keywords: "annotations notes how it's built",
        icon: <Pencil />,
        run: () => {
          toggleReview();
          if (!env.review && pathname !== "/") router.push("/");
        },
      },
      ...(env.portrait
        ? [{ id: "scatter", group: "Actions" as const, title: "Scatter the portrait", keywords: "dots dither photo fun", icon: <Mark size={14} />, run: scatterPortrait }]
        : []),
      { id: "shortcuts", group: "Actions", title: "Keyboard shortcuts", hint: "?", keywords: "keys help", icon: <Keyboard />, keepOpen: true, run: () => onViewChange("shortcuts") },

      ...links.social.map((s) => ({
        id: `social-${s.name}`,
        group: "Elsewhere" as const,
        title: s.name,
        keywords: "profile social",
        icon: SOCIAL_ICONS[s.name] ?? <ArrowUpRight />,
        run: external(s.url),
      })),
      { id: "mailto", group: "Elsewhere", title: "Send an email", keywords: "mail app compose", icon: <Mail />, run: () => (window.location.href = `mailto:${links.email}`) },

      {
        id: "hire",
        group: "Secret",
        title: "sudo hire sharath",
        triggers: ["sudo hire sharath", "sudo", "hire sharath", "hire"],
        icon: <Mark size={14} />,
        run: () => {
          toast("Permission granted. Opening a secure channel…");
          party();
          router.push("/#contact");
          whenElement<HTMLTextAreaElement>("#cf-message", (el) => {
            if (!el.value) el.value = "Hi Sharath, we'd like to talk to you about a role.";
            whenElement<HTMLInputElement>("#cf-email", (email) => window.setTimeout(() => email.focus({ preventScroll: true }), 600));
          });
        },
      },
      {
        id: "one-bit",
        group: "Secret",
        title: env.oneBit ? "Exit 1-bit mode" : "Enter 1-bit mode",
        triggers: ["1-bit", "1bit", "one bit", "matrix", "dither"],
        icon: <Mark size={14} />,
        run: toggleOneBit,
      },
      {
        id: "party",
        group: "Secret",
        title: "Party",
        triggers: ["party", "confetti", "celebrate", "yay"],
        icon: <Mark size={14} />,
        run: () => {
          party();
          toast("Dots! Dots everywhere!");
        },
      },
      {
        id: "chai",
        group: "Secret",
        title: "Make chai",
        triggers: ["coffee", "chai", "tea"],
        icon: <Mark size={14} />,
        run: () => toast("Brewing. This site runs on chai, mostly."),
      },
      {
        id: "hello",
        group: "Secret",
        title: "Say hello",
        triggers: ["hello", "hi", "hey", "namaste"],
        icon: <Mark size={14} />,
        run: () => toast("Hi! Thanks for poking around."),
      },
    ];
    return list;
  }, [env, links, pathname, router, onViewChange]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    const scored = commands.map((c) => ({ c, s: score(c, q) })).filter((r) => r.s >= 0);
    if (q) scored.sort((a, b) => b.s - a.s);
    return scored.map((r) => r.c);
  }, [commands, q]);
  const sections = q ? [{ group: "Results", items: results }] : GROUPS.map((g) => ({ group: g, items: results.filter((c) => c.group === g) }));
  const flat = sections.flatMap((s) => s.items);
  const current = flat[Math.min(active, flat.length - 1)];
  const optionId = (c: Command) => `${id}-${c.id}`;

  useEffect(() => {
    if (current) document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" });
  });

  const choose = (c: Command) => {
    const r = document.getElementById(optionId(c))?.getBoundingClientRect();
    const at = r ? { x: r.left + 28, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    if (c.keepOpen) return c.run(at);
    onClose();
    // Let the dialog close (and focus return) before acting.
    requestAnimationFrame(() => c.run(at));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!flat.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (Math.min(a, flat.length - 1) + step + flat.length) % flat.length);
    } else if (e.key === "Enter" && current) {
      e.preventDefault();
      choose(current);
    } else if (e.key === "?" && !query) {
      e.preventDefault();
      onViewChange("shortcuts");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="cmdk no-one-bit"
      aria-label={view === "commands" ? "Command menu" : "Keyboard shortcuts"}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {view === "commands" ? (
        <>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="shrink-0 text-ink-2" width={18} height={18} />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={current ? optionId(current) : undefined}
              aria-label="Search commands"
              placeholder="Type a command or search…"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-2/80 focus:outline-none"
            />
            <kbd className="kbd">esc</kbd>
          </div>

          <div id={`${id}-list`} role="listbox" aria-label="Commands" className="cmdk-list">
            {sections.map(
              (s) =>
                s.items.length > 0 && (
                  <div key={s.group} role="group" aria-labelledby={`${id}-g-${s.group}`} className="py-1.5">
                    <p id={`${id}-g-${s.group}`} className="label px-4 pt-2 pb-1.5 text-ink-2">
                      {s.group}
                    </p>
                    {s.items.map((c) => {
                      const selected = c === current;
                      return (
                        <div
                          key={c.id}
                          id={optionId(c)}
                          role="option"
                          aria-selected={selected}
                          className="cmdk-option"
                          onPointerMove={() => !selected && setActive(flat.indexOf(c))}
                          onClick={() => choose(c)}
                        >
                          <span className="grid size-5 shrink-0 place-items-center text-ink-2" aria-hidden>
                            {c.icon}
                          </span>
                          <span className={`min-w-0 flex-1 truncate ${c.group === "Secret" ? "font-mono text-sm" : ""}`}>{c.title}</span>
                          {c.hint && (c.hint.length === 1 ? <kbd className="kbd">{c.hint}</kbd> : <span className="truncate text-sm text-ink-2">{c.hint}</span>)}
                        </div>
                      );
                    })}
                  </div>
                ),
            )}
            {flat.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-ink-2">
                Nothing matches &ldquo;{query}&rdquo;. Some commands only appear when you guess them.
              </p>
            )}
          </div>

          <div className="label flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 text-ink-2">
            <p className="hidden items-center gap-3 sm:flex" aria-hidden>
              <span className="flex items-center gap-1.5">
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd> move
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="kbd">↵</kbd> select
              </span>
            </p>
            <p>Psst: a few commands are secret.</p>
          </div>
        </>
      ) : (
        <div className="cmdk-list px-5 pt-4 pb-5">
          <button type="button" data-autofocus onClick={() => onViewChange("commands")} className="label -ml-1 inline-flex items-center gap-1.5 rounded-sm px-1 py-1 text-ink-2 hover:text-ink">
            <ArrowLeft width={12} height={12} /> All commands
          </button>
          <h2 className="headline mt-3 text-[1.75rem] leading-none tracking-[-0.03em]">Keyboard shortcuts</h2>
          <dl className="mt-5 divide-y divide-line border-y border-line">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className={`flex items-center justify-between gap-6 py-2.5 ${s.single && !singleKeys ? "opacity-45" : ""}`}>
                <dt className="text-sm">{s.label}</dt>
                <dd className="flex shrink-0 flex-wrap justify-end gap-1">
                  {s.keys.map((k, i) => (
                    <kbd key={i} className="kbd">
                      {k}
                    </kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-start justify-between gap-6">
            <p className="text-sm text-ink-2" id={`${id}-single-desc`}>
              Single-key shortcuts (/, ?, T, R) can get in the way of speech input or screen readers. Turn them off here.
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={singleKeys}
              aria-label="Single-key shortcuts"
              aria-describedby={`${id}-single-desc`}
              onClick={() => {
                setShortcutsEnabled(!singleKeys);
                setSingleKeys(!singleKeys);
              }}
              className="switch shrink-0"
            >
              <span className="switch-thumb" />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
