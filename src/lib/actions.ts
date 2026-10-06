// Site-wide actions shared by the command menu, keyboard shortcuts and
// components. Everything talks through the DOM (attributes on <html>, window
// events) so no component needs a provider.

export type View = "commands" | "shortcuts";
export type SiteLinks = { email: string; resume: string; social: { name: string; url: string }[] };

export const OPEN_EVENT = "command-menu:open";
export const TOAST_EVENT = "site:toast";
/** Ask the hero portrait to scatter its dots. */
export const PORTRAIT_SCATTER_EVENT = "portrait:scatter";

const SHORTCUTS_KEY = "shortcuts";

export const openCommandMenu = (view: View = "commands") => window.dispatchEvent(new CustomEvent<View>(OPEN_EVENT, { detail: view }));
export const toast = (message: string) => window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));

// Single-key shortcuts can be switched off (WCAG 2.1.4); the choice is remembered.
export const shortcutsEnabled = () => localStorage.getItem(SHORTCUTS_KEY) !== "off";
export const setShortcutsEnabled = (on: boolean) => localStorage.setItem(SHORTCUTS_KEY, on ? "on" : "off");

export const toggleReview = () => document.documentElement.toggleAttribute("data-review");

/** 1-bit mode: the whole page through an ordered-dither SVG filter (see OneBitFilter in command-menu.tsx). */
export function toggleOneBit() {
  const on = document.documentElement.toggleAttribute("data-one-bit");
  toast(on ? "1-bit mode. Everything is dots now." : "Back to full colour.");
}

export const scatterPortrait = () => window.dispatchEvent(new Event(PORTRAIT_SCATTER_EVENT));
