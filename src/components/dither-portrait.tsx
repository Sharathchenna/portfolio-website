"use client";

import { useEffect, useRef } from "react";
import { bayer, developKey, ditherGrid, redChannel, type Channel, type DitherRequest, type DitherResult } from "@/lib/dither";

// Source maps produced by scripts/build-assets.ts (240×300, 4:5).
const LUMA_SRC = "/portrait/luma.webp";
const MASK_SRC = "/portrait/mask.webp";
const PHOTO_SRC = "/portrait/photo.webp";

const DEVELOP_MS = 1100;
const LENS_RADIUS = 0.28; // of the grid width
const LENS_CORE = 0.5; // fraction of the radius that shows the photo outright

// Dot physics, in grid cells and seconds. Scattered dots fly free (drag +
// gravity) until their release time, then a bouncy spring pulls them home.
const SPRING_K = 90;
const SPRING_C = 2 * Math.sqrt(SPRING_K) * 0.42;
const DRAG = 1.6;
const GRAVITY = 150;
const WAKE_SPEED = 70; // lens speed (cells/s) above which it pushes dots aside
const TAP_MS = 320;
const TAP_SLOP = 8; // px

/** Ask the hero portrait to scatter its dots (e.g. from the command menu). */
export const PORTRAIT_SCATTER_EVENT = "portrait:scatter";

type Grid = {
  cols: number;
  rows: number;
  dot: number; // device pixels per cell
  dots: Uint8Array;
  /** Dot cells sorted by when they appear during the develop-in, with their keys. */
  order: Int32Array;
  keys: Float32Array;
  /** Per-dot physics, indexed like `order`: offset from home, velocity, free-flight deadline. */
  ox: Float32Array;
  oy: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  freeUntil: Float32Array;
};

async function loadChannel(src: string): Promise<Channel> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return redChannel(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
}

/**
 * Dithering runs in a Web Worker (fetch, decode, resample, Atkinson, sort), so
 * the main thread only ever copies pixels. Falls back to the main thread where
 * workers or OffscreenCanvas aren't available.
 */
function createDitherer(onResult: (r: DitherResult) => void, onError: () => void) {
  let worker: Worker | null = null;
  let pending: DitherRequest | null = null;
  let local: Promise<{ luma: Channel; mask: Channel }> | null = null;

  const runLocally = async (req: DitherRequest) => {
    try {
      local ??= Promise.all([loadChannel(req.luma), loadChannel(req.mask)]).then(([luma, mask]) => ({ luma, mask }));
      onResult({ id: req.id, cols: req.cols, rows: req.rows, ...ditherGrid(await local, req.cols, req.rows, req.dark) });
    } catch {
      onError();
    }
  };
  const abandonWorker = () => {
    worker?.terminate();
    worker = null;
    if (pending) runLocally(pending);
  };

  try {
    if (typeof OffscreenCanvas !== "undefined") {
      worker = new Worker(new URL("../lib/dither.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<DitherResult | { id: number; error: string }>) => {
        if ("error" in e.data) abandonWorker();
        else onResult(e.data);
      };
      worker.onerror = abandonWorker;
    }
  } catch {
    worker = null;
  }

  return {
    request(req: DitherRequest) {
      pending = req;
      if (worker) worker.postMessage(req);
      else runLocally(req);
    },
    dispose() {
      worker?.terminate();
    },
  };
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * The hero portrait: an Atkinson-dithered render of a photo, drawn live in the
 * theme's accent colour. Pointer movement opens a lens whose edge is itself
 * Bayer-dithered, revealing the original photograph beneath.
 *
 * Rendering: the dots canvas is exactly one pixel per cell and is upscaled by
 * the compositor (image-rendering: pixelated) to an integer number of device
 * pixels per dot, so frames cost a putImageData of ~17k cells and no raster
 * work. The full-resolution photo canvas only draws while the lens is open.
 * Dithering waits for an idle period; the loop stops whenever nothing moves.
 */
export function DitherPortrait({ className = "", alt }: { className?: string; alt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const dotsCanvas = dotsRef.current;
    const photoCanvas = photoRef.current;
    if (!wrap || !dotsCanvas || !photoCanvas) return;
    const dctx = dotsCanvas.getContext("2d");
    const pctx = photoCanvas.getContext("2d");
    if (!dctx || !pctx) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let raf = 0;
    let grid: Grid | null = null;
    let photo: HTMLImageElement | null = null;
    let color: [number, number, number] = [43, 53, 245];
    let image: ImageData | null = null;

    // Lens mask at grid resolution, scaled up with nearest-neighbour onto the photo.
    const lensMask = document.createElement("canvas");
    const lctx = lensMask.getContext("2d")!;
    let lensImage: ImageData | null = null;
    let lensCells: Uint8Array | null = null;
    let photoShown = false;
    let disturbed = false; // any dot away from home
    let hovering = false;
    let lensHeldUntil = 0; // lens stays shut while a scatter plays out

    let develop = reduceMotion ? 1 : 0;
    let developStart = 0;
    let shown = 0; // develop-in progress through grid.order

    // Lens state, in grid cells. Spring-follows the pointer.
    const lens = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, r: 0, vr: 0, tr: 0 };
    let lastTime = 0;
    let anyLensLast = false;

    const readColor = () => {
      const m = getComputedStyle(wrap).color.match(/\d+(\.\d+)?/g); // wrap is text-accent
      if (m) color = [Number(m[0]), Number(m[1]), Number(m[2])];
    };

    // Layout asks the worker for a grid; apply() installs whichever answer is latest.
    let requestId = 0;
    let pendingDot = 0;
    let pendingDpr = 1;
    let visible = false;
    let started = false;

    const layout = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 10) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const dot = Math.max(2, Math.round((rect.width < 420 ? 2.5 : 3) * dpr));
      pendingDot = dot;
      pendingDpr = dpr;
      ditherer.request({
        id: ++requestId,
        cols: Math.floor((rect.width * dpr) / dot),
        rows: Math.floor((rect.height * dpr) / dot),
        dark: document.documentElement.classList.contains("dark"),
        luma: new URL(LUMA_SRC, location.href).href,
        mask: new URL(MASK_SRC, location.href).href,
      });
    };

    const apply = (r: DitherResult) => {
      if (disposed || r.id !== requestId) return; // a newer layout is already in flight
      const { cols, rows } = r;
      const dot = pendingDot;
      const dpr = pendingDpr;
      const n = r.order.length;
      grid = {
        cols, rows, dot, dots: r.dots, order: r.order, keys: r.keys,
        ox: new Float32Array(n), oy: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n), freeUntil: new Float32Array(n),
      };
      disturbed = false;
      const cssW = `${(cols * dot) / dpr}px`;
      const cssH = `${(rows * dot) / dpr}px`;
      dotsCanvas.width = lensMask.width = cols;
      dotsCanvas.height = lensMask.height = rows;
      photoCanvas.width = cols * dot;
      photoCanvas.height = rows * dot;
      for (const c of [dotsCanvas, photoCanvas]) {
        c.style.width = cssW;
        c.style.height = cssH;
      }
      image = dctx.createImageData(cols, rows);
      lensImage = lctx.createImageData(cols, rows);
      lensCells = new Uint8Array(cols * rows);
      photoShown = false;
      readColor();
      shown = 0;
      draw();
      maybeStart();
    };

    const maybeStart = () => {
      if (started || !visible || !grid) return;
      started = true;
      wrap.dataset.ready = "true";
      kick();
    };

    const ditherer = createDitherer(apply, () => {
      wrap.dataset.ready = "failed"; // static fallback stays visible
    });

    /** Full redraw: used when the lens is open, dots are displaced, or after layout/theme changes. */
    const draw = () => {
      if (!grid || !image || !lensImage || !lensCells) return;
      const { cols, rows, order, keys, ox, oy } = grid;
      const d = image.data;
      const l = lensImage.data;
      const [r, g, b] = color;
      const lensOn = lens.r > 0.5 && !!photo?.complete;
      const p = ease(develop) * 1.001;
      let anyLens = false;

      // Pass 1: the lens shape, only within its bounding box.
      if (lensOn || anyLensLast) {
        l.fill(0);
        lensCells.fill(0);
      }
      if (lensOn) {
        const radius = lens.r;
        const core = radius * LENS_CORE;
        const x0 = Math.max(0, Math.floor(lens.x - radius));
        const x1 = Math.min(cols - 1, Math.ceil(lens.x + radius));
        const y0 = Math.max(0, Math.floor(lens.y - radius));
        const y1 = Math.min(rows - 1, Math.ceil(lens.y + radius));
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            const dx = x - lens.x;
            const dy = y - lens.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius && 1 - smoothstep(core, radius, dist) > bayer(x, y)) {
              const i = y * cols + x;
              lensCells[i] = 1;
              l[i * 4 + 3] = 255;
              anyLens = true;
            }
          }
        }
      }
      anyLensLast = anyLens;

      // Pass 2: every dot, wherever its physics has put it.
      d.fill(0);
      for (let k = 0; k < order.length; k++) {
        if (develop < 1 && keys[k] >= p) break; // order is sorted by develop key
        const i = order[k];
        let x = i % cols;
        let y = (i / cols) | 0;
        if (disturbed) {
          x = Math.round(x + ox[k]);
          y = Math.round(y + oy[k]);
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        }
        const j = y * cols + x;
        if (lensCells[j]) continue;
        const o = j * 4;
        d[o] = r;
        d[o + 1] = g;
        d[o + 2] = b;
        d[o + 3] = 255;
      }
      dctx.putImageData(image, 0, 0);

      if (anyLens && photo) {
        lctx.putImageData(lensImage, 0, 0);
        pctx.globalCompositeOperation = "copy";
        pctx.imageSmoothingEnabled = true;
        pctx.drawImage(photo, 0, 0, photoCanvas.width, photoCanvas.height);
        pctx.globalCompositeOperation = "destination-in";
        pctx.imageSmoothingEnabled = false;
        pctx.drawImage(lensMask, 0, 0, photoCanvas.width, photoCanvas.height);
        pctx.globalCompositeOperation = "source-over";
        photoShown = true;
      } else if (photoShown) {
        pctx.clearRect(0, 0, photoCanvas.width, photoCanvas.height);
        photoShown = false;
      }
    };

    /** Throw every dot outward from (cx, cy); each is released back to its spring a little later. */
    const scatter = (cx: number, cy: number) => {
      if (!grid || reduceMotion) return;
      const { cols, order, ox, oy, vx, vy, freeUntil } = grid;
      const now = performance.now() / 1000;
      const reach = cols * 0.38;
      for (let k = 0; k < order.length; k++) {
        const i = order[k];
        const px = (i % cols) + ox[k];
        const py = ((i / cols) | 0) + oy[k];
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.9;
        const speed = (220 * Math.exp(-dist / reach) + 18) * (0.55 + Math.random() * 0.8);
        vx[k] += Math.cos(angle) * speed;
        vy[k] += Math.sin(angle) * speed - 35;
        freeUntil[k] = now + 0.16 + Math.random() * 0.34 + (dist / cols) * 0.25;
      }
      disturbed = true;
      lensHeldUntil = now + 0.9;
      lens.tr = 0;
      kick();
    };

    /** The lens is a bubble: moving it fast shoves the dots in front of it. */
    const wake = (dt: number) => {
      if (!grid || lens.r < 2) return;
      const speed = Math.sqrt(lens.vx * lens.vx + lens.vy * lens.vy);
      if (speed < WAKE_SPEED) return;
      const { cols, order, ox, oy, vx, vy } = grid;
      const ux = lens.vx / speed;
      const uy = lens.vy / speed;
      const inner = lens.r * 0.8;
      const band = lens.r * 0.75;
      const push = (speed - WAKE_SPEED) * 9 * dt;
      for (let k = 0; k < order.length; k++) {
        const i = order[k];
        const dx = (i % cols) + ox[k] - lens.x;
        const dy = ((i / cols) | 0) + oy[k] - lens.y;
        if (Math.abs(dx) > inner + band || Math.abs(dy) > inner + band) continue;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < inner || dist > inner + band) continue;
        const facing = (dx * ux + dy * uy) / dist;
        if (facing <= 0) continue;
        // Jitter breaks the push into spray rather than a clean ring; the cap
        // keeps dots from outrunning the lens that's shoving them.
        const f = push * facing * (1 - (dist - inner) / band) * (0.5 + Math.random());
        vx[k] += (dx / dist) * f;
        vy[k] += (dy / dist) * f;
        const v = Math.sqrt(vx[k] * vx[k] + vy[k] * vy[k]);
        if (v > speed * 0.8) {
          vx[k] *= (speed * 0.8) / v;
          vy[k] *= (speed * 0.8) / v;
        }
        disturbed = true;
      }
    };

    /** Integrate dot physics; returns false once every dot is home and still. */
    const physics = (dt: number) => {
      if (!grid || !disturbed) return false;
      const { ox, oy, vx, vy, freeUntil } = grid;
      const now = performance.now() / 1000;
      const drag = Math.exp(-DRAG * dt);
      let restless = false;
      for (let k = 0; k < ox.length; k++) {
        if (now < freeUntil[k]) {
          vx[k] *= drag;
          vy[k] = vy[k] * drag + GRAVITY * dt;
        } else {
          vx[k] += (-SPRING_K * ox[k] - SPRING_C * vx[k]) * dt;
          vy[k] += (-SPRING_K * oy[k] - SPRING_C * vy[k]) * dt;
        }
        ox[k] += vx[k] * dt;
        oy[k] += vy[k] * dt;
        if (!restless && (Math.abs(ox[k]) > 0.3 || Math.abs(oy[k]) > 0.3 || Math.abs(vx[k]) > 1 || Math.abs(vy[k]) > 1 || now < freeUntil[k])) {
          restless = true;
        }
      }
      if (!restless) {
        ox.fill(0);
        oy.fill(0);
        vx.fill(0);
        vy.fill(0);
        disturbed = false;
      }
      return true;
    };

    /** Develop-in without full redraws: only switch on cells passed since last frame. */
    const developStep = () => {
      if (!grid || !image) return;
      const { order, keys } = grid;
      const d = image.data;
      const limit = ease(develop) * 1.001;
      const [r, g, b] = color;
      while (shown < order.length && keys[shown] < limit) {
        const o = order[shown] * 4;
        d[o] = r;
        d[o + 1] = g;
        d[o + 2] = b;
        d[o + 3] = 255;
        shown++;
      }
      dctx.putImageData(image, 0, 0);
    };

    const step = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, lastTime ? (now - lastTime) / 1000 : 1 / 60);
      lastTime = now;
      let busy = false;

      if (develop < 1) {
        if (!developStart) developStart = now;
        develop = Math.min(1, (now - developStart) / DEVELOP_MS);
        busy = true;
      }

      if (reduceMotion) {
        lens.x = lens.tx;
        lens.y = lens.ty;
        lens.r = lens.tr;
      } else {
        // Position: near-critically damped, snappy. Radius: softer, slight overshoot.
        const k = 260;
        const c = 2 * Math.sqrt(k) * 0.9;
        lens.vx += (k * (lens.tx - lens.x) - c * lens.vx) * dt;
        lens.vy += (k * (lens.ty - lens.y) - c * lens.vy) * dt;
        lens.x += lens.vx * dt;
        lens.y += lens.vy * dt;
        const kr = 140;
        const cr = 2 * Math.sqrt(kr) * 0.7;
        lens.vr += (kr * (lens.tr - lens.r) - cr * lens.vr) * dt;
        lens.r = Math.max(0, lens.r + lens.vr * dt);
        const moving =
          Math.abs(lens.tx - lens.x) + Math.abs(lens.ty - lens.y) > 0.05 ||
          Math.abs(lens.vx) + Math.abs(lens.vy) > 0.05 ||
          Math.abs(lens.tr - lens.r) > 0.05 ||
          Math.abs(lens.vr) > 0.05;
        if (moving) busy = true;
        else {
          lens.r = lens.tr;
          lens.vr = 0;
        }
      }

      if (!reduceMotion) {
        wake(dt);
        if (physics(dt)) busy = true;
        // After a scatter, the lens comes back if the pointer is still here.
        if (lensHeldUntil && now / 1000 > lensHeldUntil) {
          lensHeldUntil = 0;
          if (hovering && grid) {
            lens.tr = grid.cols * LENS_RADIUS;
            busy = true;
          }
        }
      }

      if (develop < 1 && !disturbed && lens.r < 0.5 && lens.tr === 0 && !photoShown) developStep();
      else draw();
      if (busy && !disposed) raf = requestAnimationFrame(step);
      else lastTime = 0;
    };

    const kick = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(step);
    };

    const loadPhoto = () => {
      if (photo) return;
      photo = new Image();
      photo.decoding = "async";
      photo.src = PHOTO_SRC;
    };

    const toGrid = (e: PointerEvent) => {
      if (!grid) return null;
      const rect = dotsCanvas.getBoundingClientRect();
      return { x: ((e.clientX - rect.left) / rect.width) * grid.cols, y: ((e.clientY - rect.top) / rect.height) * grid.rows };
    };

    let releaseTimer = 0;
    let down: { x: number; y: number; t: number } | null = null;
    const lensOpen = () => grid !== null && !lensHeldUntil;
    const open = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovering = true;
      loadPhoto();
      const pt = toGrid(e);
      if (!pt || !grid || !lensOpen()) return;
      // Start where the pointer entered so the lens doesn't fly in from a corner.
      if (lens.r < 0.5) {
        lens.x = lens.tx = pt.x;
        lens.y = lens.ty = pt.y;
      }
      lens.tr = grid.cols * LENS_RADIUS;
      kick();
    };
    const close = () => {
      lens.tr = 0;
      kick();
    };
    const onMove = (e: PointerEvent) => {
      const pt = toGrid(e);
      if (!pt) return;
      lens.tx = pt.x;
      lens.ty = pt.y;
      if (e.pointerType !== "mouse" && grid && lensOpen()) lens.tr = grid.cols * LENS_RADIUS;
      kick();
    };
    // Touch fires pointerleave straight after pointerup; onUp's timer closes the lens instead.
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hovering = false;
      close();
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      wrap.dataset.touched = "true";
      if (e.pointerType === "mouse") return;
      clearTimeout(releaseTimer);
      open(e);
    };
    const onUp = (e: PointerEvent) => {
      const tap =
        e.type === "pointerup" &&
        down !== null &&
        e.timeStamp - down.t < TAP_MS &&
        Math.hypot(e.clientX - down.x, e.clientY - down.y) < TAP_SLOP;
      down = null;
      if (tap) {
        const pt = toGrid(e);
        if (pt) scatter(pt.x, pt.y);
      }
      if (e.pointerType === "mouse") return;
      releaseTimer = window.setTimeout(close, 450);
    };
    const onScatterEvent = () => {
      if (grid) scatter(grid.cols / 2, grid.rows * 0.4);
    };
    window.addEventListener(PORTRAIT_SCATTER_EVENT, onScatterEvent);

    const listeners: [string, (e: PointerEvent) => void][] = [
      ["pointerenter", open],
      ["pointermove", onMove],
      ["pointerleave", onLeave],
      ["pointerdown", onDown],
      ["pointerup", onUp],
      ["pointercancel", onUp],
    ];
    for (const [type, fn] of listeners) wrap.addEventListener(type, fn as EventListener);

    let resizeRaf = 0;
    let lastWidth = 0;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (Math.abs(w - lastWidth) < 1) return;
      lastWidth = w;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(layout);
    });
    const themeObserver = new MutationObserver(() => layout());
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      maybeStart();
    });
    const idle = (cb: () => void, timeout: number) =>
      window.requestIdleCallback ? window.requestIdleCallback(cb, { timeout }) : window.setTimeout(cb, Math.min(timeout, 300));

    // Kick off after hydration has settled; the heavy lifting happens off-thread.
    idle(() => {
      if (disposed) return;
      lastWidth = wrap.getBoundingClientRect().width;
      layout();
      ro.observe(wrap);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      io.observe(wrap);
      idle(loadPhoto, 4000); // warm the photo so the first hover is instant
    }, 1000);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      clearTimeout(releaseTimer);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      ditherer.dispose();
      window.removeEventListener(PORTRAIT_SCATTER_EVENT, onScatterEvent);
      for (const [type, fn] of listeners) wrap.removeEventListener(type, fn as EventListener);
    };
  }, []);

  return (
    <div ref={wrapRef} role="img" aria-label={alt} className={`portrait relative grid aspect-[4/5] touch-pan-y place-items-center text-accent select-none ${className}`}>
      <div className="portrait-static absolute inset-0" aria-hidden />
      <canvas ref={photoRef} className="portrait-canvas col-start-1 row-start-1" aria-hidden />
      <canvas ref={dotsRef} className="portrait-canvas col-start-1 row-start-1" aria-hidden />
      <span className="portrait-hint label" aria-hidden>
        <span className="portrait-hint-finger" />
        Drag · Tap
      </span>
    </div>
  );
}
