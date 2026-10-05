import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Decorative by default: every icon sits next to visible text or an aria-label.
const base = { "aria-hidden": true, focusable: false, width: 16, height: 16 } as const;

export const ArrowRight = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export const ArrowUpRight = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <path d="M5 11l6-6M6 5h5v5" />
  </svg>
);

export const ArrowDown = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <path d="M8 3v10M4 9l4 4 4-4" />
  </svg>
);

export const ArrowUp = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <path d="M8 13V3M4 7l4-4 4 4" />
  </svg>
);

export const Copy = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5v-.5A1.5 1.5 0 009 1.5H4A1.5 1.5 0 002.5 3v5A1.5 1.5 0 004 9.5h.5" />
  </svg>
);

export const Check = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <path d="M3 8.5l3.2 3L13 4.5" />
  </svg>
);

export const Sun = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.2M8 13.3v1.2M14.5 8h-1.2M2.7 8H1.5M12.6 3.4l-.85.85M4.25 11.75l-.85.85M12.6 12.6l-.85-.85M4.25 4.25l-.85-.85" />
  </svg>
);

export const Moon = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <path d="M13.5 9.6A5.6 5.6 0 016.4 2.5a5.6 5.6 0 107.1 7.1z" />
  </svg>
);

export const Pencil = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <path d="M10.5 2.5l3 3L5.5 13.5H2.5v-3z" />
    <path d="M9 4l3 3" />
  </svg>
);

export const GitHub = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} fill="currentColor" {...p}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 015.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

export const LinkedIn = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} fill="currentColor" {...p}>
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
);

export const X = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} fill="currentColor" {...p}>
    <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z" />
  </svg>
);

export const Apple = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} fill="currentColor" {...p}>
    <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.46 2.2 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.61 1.09zm3.38-3.07c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.46 2.34-1.27 3.71 1.34.1 2.71-.69 3.55-1.7z" />
  </svg>
);

export const Globe = (p: P) => (
  <svg viewBox="0 0 16 16" {...base} {...stroke} {...p}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M1.75 8h12.5M8 1.75c1.7 1.8 2.5 3.9 2.5 6.25S9.7 12.45 8 14.25C6.3 12.45 5.5 10.35 5.5 8S6.3 3.55 8 1.75z" />
  </svg>
);

export const SOCIAL_ICONS = { GitHub, LinkedIn, X } as const;
