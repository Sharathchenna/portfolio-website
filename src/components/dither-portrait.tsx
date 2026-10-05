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

type Grid = {
  cols: number;
  rows: number;
  dot: number; // device pixels per cell
  dots: Uint8Array;
  /** Dot cells sorted by when they appear during the develop-in, with their keys. */
  order: Int32Array;
  keys: Float32Array;
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
    let photoShown = false;

    let develop = reduceMotion ? 1 : 0;
    let developStart = 0;
    let shown = 0; // develop-in progress through grid.order

    // Lens state, in grid cells. Spring-follows the pointer.
    const lens = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, r: 0, vr: 0, tr: 0 };
    let lastTime = 0;

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
      grid = { cols, rows, dot, dots: r.dots, order: r.order, keys: r.keys };
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

    /** Full redraw: used when the lens is open, or after layout/theme changes. */
    const draw = () => {
      if (!grid || !image || !lensImage) return;
      const { cols, rows, dots } = grid;
      const d = image.data;
      const l = lensImage.data;
      const [r, g, b] = color;
      const lensOn = lens.r > 0.5 && !!photo?.complete;
      const radius = lens.r;
      const core = radius * LENS_CORE;
      const p = ease(develop) * 1.001;
      let anyLens = false;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const o = i * 4;
          let inLens = false;
          if (lensOn) {
            const dx = x - lens.x;
            const dy = y - lens.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) inLens = 1 - smoothstep(core, radius, dist) > bayer(x, y);
          }
          const visible = develop >= 1 || developKey(x, y, rows) < p;
          d[o] = r;
          d[o + 1] = g;
          d[o + 2] = b;
          d[o + 3] = dots[i] && visible && !inLens ? 255 : 0;
          l[o + 3] = inLens ? 255 : 0;
          if (inLens) anyLens = true;
        }
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

      if (develop < 1 && lens.r < 0.5 && lens.tr === 0 && !photoShown) developStep();
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
    const open = (e: PointerEvent) => {
      loadPhoto();
      const pt = toGrid(e);
      if (!pt || !grid) return;
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
      if (e.pointerType !== "mouse" && grid) lens.tr = grid.cols * LENS_RADIUS;
      kick();
    };
    // Touch fires pointerleave straight after pointerup; onUp's timer closes the lens instead.
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") close();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      clearTimeout(releaseTimer);
      open(e);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      releaseTimer = window.setTimeout(close, 450);
    };

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
      for (const [type, fn] of listeners) wrap.removeEventListener(type, fn as EventListener);
    };
  }, []);

  return (
    <div ref={wrapRef} role="img" aria-label={alt} className={`portrait relative grid aspect-[4/5] touch-pan-y place-items-center text-accent select-none ${className}`}>
      <div className="portrait-static absolute inset-0" aria-hidden />
      <canvas ref={photoRef} className="portrait-canvas col-start-1 row-start-1" aria-hidden />
      <canvas ref={dotsRef} className="portrait-canvas col-start-1 row-start-1" aria-hidden />
    </div>
  );
}
