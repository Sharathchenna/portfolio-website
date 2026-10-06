// One-shot celebratory effects: plain DOM nodes animated with WAAPI using
// transform and opacity only, removed when done. All no-ops under reduced motion.

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function layer() {
  const el = document.createElement("div");
  el.className = "fx-layer";
  el.setAttribute("aria-hidden", "true");
  document.body.append(el);
  return el;
}

function dot(parent: HTMLElement, x: number, y: number, size: number, color: string) {
  const el = document.createElement("span");
  el.className = "fx-dot";
  el.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;background:${color}`;
  parent.append(el);
  return el;
}

type BurstOptions = { color?: string; count?: number; power?: number; spread?: number };

/** A spray of square dots from (x, y) in viewport px that arcs up and falls away. */
export function burst(x: number, y: number, { color = "var(--accent)", count = 26, power = 1, spread = 1.1 }: BurstOptions = {}) {
  if (reduced()) return;
  const root = layer();
  let longest = 0;
  for (let i = 0; i < count; i++) {
    const size = Math.round(rand(3, 7));
    const angle = -Math.PI / 2 + rand(-0.5, 0.5) * Math.PI * spread;
    const speed = rand(260, 640) * power;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const gravity = 1500;
    const duration = rand(650, 1100);
    const spin = rand(-1, 1) * 270;
    const frames: Keyframe[] = [];
    for (let s = 0; s <= 8; s++) {
      const t = (s / 8) * (duration / 1000);
      const p = s / 8;
      frames.push({
        transform: `translate(${(vx * t).toFixed(1)}px, ${(vy * t + 0.5 * gravity * t * t).toFixed(1)}px) rotate(${(spin * p).toFixed(0)}deg) scale(${(1 - p * 0.5).toFixed(2)})`,
        opacity: p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4,
      });
    }
    dot(root, x, y, size, color).animate(frames, { duration, easing: "linear", fill: "forwards" });
    longest = Math.max(longest, duration);
  }
  window.setTimeout(() => root.remove(), longest + 50);
}

/** Dots raining from the top of the viewport, for no reason at all. */
export function party() {
  if (reduced()) return;
  const w = window.innerWidth;
  for (let i = 0; i < 6; i++) {
    window.setTimeout(() => burst(rand(w * 0.1, w * 0.9), window.innerHeight * rand(0.55, 0.85), { count: 30, power: 1.5, spread: 0.7 }), i * 140);
  }
}

/** A short horizontal shake: "no, not like that". */
export function shake(el: Element) {
  if (reduced()) return;
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(5px)" },
      { transform: "translateX(-3px)" },
      { transform: "translateX(2px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 380, easing: "ease-out" },
  );
}

// ── Paper plane ───────────────────────────────────────────────────────────
// Drawn as pixel art by rasterising a vector paper plane onto a coarse grid:
// paper-coloured fill, ink outline, and a checkerboard-dithered lower wing.

const PLANE_COLS = 20;
const PLANE_ROWS = 16;
const PLANE_CELL = 3;
const NOSE_ANGLE = Math.atan2(-0.5 * PLANE_ROWS, 0.5 * PLANE_COLS); // the nose is the top-right corner

type Pt = [number, number];
const UPPER: Pt[] = [[0, 0.45], [1, 0], [0.36, 0.62]];
const LOWER: Pt[] = [[0.36, 0.62], [1, 0], [0.46, 1]];

function inside([x, y]: Pt, poly: Pt[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

let planeSvg: string | null = null;
function planeMarkup() {
  if (planeSvg) return planeSvg;
  const cell = (c: number, r: number): Pt => [(c + 0.5) / PLANE_COLS, (r + 0.5) / PLANE_ROWS];
  const kind = (c: number, r: number) => {
    if (c < 0 || r < 0 || c >= PLANE_COLS || r >= PLANE_ROWS) return 0;
    const p = cell(c, r);
    return inside(p, UPPER) ? 1 : inside(p, LOWER) ? 2 : 0;
  };
  let ink = "";
  let paper = "";
  for (let r = 0; r < PLANE_ROWS; r++) {
    for (let c = 0; c < PLANE_COLS; c++) {
      const k = kind(c, r);
      if (!k) continue;
      const edge = !kind(c - 1, r) || !kind(c + 1, r) || !kind(c, r - 1) || !kind(c, r + 1);
      // The fold line between the two wings is drawn too.
      const fold = k === 1 && kind(c, r + 1) === 2;
      const shade = k === 2 && (c + r) % 2 === 0;
      if (edge || fold || shade) ink += `M${c} ${r}h1v1h-1z`;
      else paper += `M${c} ${r}h1v1h-1z`;
    }
  }
  planeSvg = `<svg viewBox="0 0 ${PLANE_COLS} ${PLANE_ROWS}" width="${PLANE_COLS * PLANE_CELL}" height="${PLANE_ROWS * PLANE_CELL}" shape-rendering="crispEdges"><path fill="var(--paper)" d="${paper}"/><path fill="var(--ink)" d="${ink}"/></svg>`;
  return planeSvg;
}

/** Folds a paper plane out of `from` and flies it off the top-right of the screen, trailing dots. */
export function launchPlane(from: Element) {
  if (reduced()) return;
  const r = from.getBoundingClientRect();
  const x0 = r.left + r.width / 2;
  const y0 = r.top + r.height / 2;
  const w = window.innerWidth;
  // Dip, then climb out past the top-right corner.
  const p0: Pt = [x0, y0];
  const p1: Pt = [x0 + 160, y0 + 60];
  const p2: Pt = [x0 + Math.max(260, (w - x0) * 0.65), y0 - 240];
  const p3: Pt = [w + 120, Math.min(y0 - 360, -80)];
  const at = (t: number): Pt => {
    const u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ];
  };

  const root = layer();
  const plane = document.createElement("div");
  plane.className = "fx-plane";
  plane.innerHTML = planeMarkup();
  plane.style.cssText = `left:${-(PLANE_COLS * PLANE_CELL) / 2}px;top:${-(PLANE_ROWS * PLANE_CELL) / 2}px`;
  root.append(plane);

  const duration = 1500;
  const frames: Keyframe[] = [];
  const steps = 30;
  for (let s = 0; s <= steps; s++) {
    // Gentle ease-in along the path: the plane gathers speed as it climbs.
    const p = s / steps;
    const t = p * (0.55 + 0.45 * p);
    const [x, y] = at(t);
    const [nx, ny] = at(Math.min(1, t + 0.01));
    const heading = Math.atan2(ny - y, nx - x) - NOSE_ANGLE;
    const scale = p < 0.12 ? 0.3 + (p / 0.12) * 0.7 : 1;
    frames.push({ offset: p, transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${heading.toFixed(3)}rad) scale(${scale.toFixed(2)})` });

    if (s > 3 && s % 2 === 0 && s < steps - 2) {
      const trail = dot(root, x, y, 4, "var(--ink)");
      trail.style.opacity = "0";
      trail.animate([{ opacity: 0.85, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.3)" }], {
        duration: 520,
        delay: duration * p,
        easing: "ease-out",
        fill: "forwards",
      });
    }
  }
  plane.animate(frames, { duration, easing: "linear", fill: "forwards" });
  window.setTimeout(() => root.remove(), duration + 600);
}
