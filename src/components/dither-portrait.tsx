"use client";

import { useEffect, useRef } from "react";
import { atkinson, bayer, haloFromMask, resample } from "@/lib/dither";

// Source maps produced by scripts/build-assets.ts (240×300, 4:5).
const LUMA_SRC = "/portrait/luma.webp";
const MASK_SRC = "/portrait/mask.webp";
const PHOTO_SRC = "/portrait/photo.webp";

const DEVELOP_MS = 1400;
const LENS_RADIUS = 0.28; // of the grid width
const LENS_CORE = 0.5; // fraction of the radius that is fully "developed"

type Grid = {
  cols: number;
  rows: number;
  dot: number; // device pixels per cell
  dots: Uint8Array;
};

async function loadChannel(src: string) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  const out = new Float32Array(c.width * c.height);
  for (let i = 0; i < out.length; i++) out[i] = data[i * 4] / 255;
  return { data: out, w: c.width, h: c.height };
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * The hero portrait: an Atkinson-dithered render of a photo, drawn live into a
 * <canvas> in the theme's accent colour. Pointer movement opens a lens whose
 * edge is itself Bayer-dithered, revealing the original photograph beneath.
 *
 * Cost model: the dither is computed once per size/theme change (~3 ms); the
 * animation loop only runs while the lens moves or the develop-in plays, and
 * stops completely when idle or off-screen.
 */
export function DitherPortrait({ className = "", alt }: { className?: string; alt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let raf = 0;
    let grid: Grid | null = null;
    let source: { luma: Awaited<ReturnType<typeof loadChannel>>; mask: Awaited<ReturnType<typeof loadChannel>> } | null = null;
    let photo: HTMLImageElement | null = null;
    let color = [43, 53, 245];

    // Offscreen layers at grid resolution, scaled up with nearest-neighbour.
    const dotLayer = document.createElement("canvas");
    const lensLayer = document.createElement("canvas");
    const dotCtx = dotLayer.getContext("2d")!;
    const lensCtx = lensLayer.getContext("2d")!;
    let dotImage: ImageData | null = null;
    let lensImage: ImageData | null = null;

    // Develop-in: 0 → 1. Starts when first visible.
    let develop = reduceMotion ? 1 : 0;
    let developStart = 0;

    // Lens state, in grid cells. Spring-follows the pointer.
    const lens = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, r: 0, vr: 0, tr: 0 };
    let lastTime = 0;

    const readColor = () => {
      const probe = getComputedStyle(wrap).color; // wrap is text-accent
      const m = probe.match(/\d+(\.\d+)?/g);
      if (m) color = [Number(m[0]), Number(m[1]), Number(m[2])];
    };

    const layout = () => {
      if (!source) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 10) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const dotCss = rect.width < 420 ? 2.5 : 3;
      const dot = Math.max(2, Math.round(dotCss * dpr));
      const cols = Math.floor((rect.width * dpr) / dot);
      const rows = Math.floor((rect.height * dpr) / dot);
      const luma = resample(source.luma.data, source.luma.w, source.luma.h, cols, rows);
      const mask = resample(source.mask.data, source.mask.w, source.mask.h, cols, rows);
      const halo = haloFromMask(mask, cols, rows, Math.max(1, Math.round(cols / 85)));
      const dark = document.documentElement.classList.contains("dark");
      grid = { cols, rows, dot, dots: atkinson(luma, cols, rows, { halo, inverse: dark }) };

      canvas.width = cols * dot;
      canvas.height = rows * dot;
      canvas.style.width = `${canvas.width / dpr}px`;
      canvas.style.height = `${canvas.height / dpr}px`;
      dotLayer.width = lensLayer.width = cols;
      dotLayer.height = lensLayer.height = rows;
      dotImage = dotCtx.createImageData(cols, rows);
      lensImage = lensCtx.createImageData(cols, rows);
      readColor();
      draw();
    };

    const draw = () => {
      if (!grid || !dotImage || !lensImage) return;
      const { cols, rows, dots } = grid;
      const d = dotImage.data;
      const l = lensImage.data;
      const [r, g, b] = color;
      const lensOn = lens.r > 0.5 && photo?.complete;
      const radius = lens.r;
      const core = radius * LENS_CORE;
      const p = ease(develop);
      let anyLens = false;

      for (let y = 0; y < rows; y++) {
        // Develop sweeps top-down while dissolving in Bayer order.
        const rowBias = (y / rows) * 0.25;
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const o = i * 4;
          const threshold = bayer(x, y);
          let inLens = false;
          if (lensOn) {
            const dx = x - lens.x;
            const dy = y - lens.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) inLens = 1 - smoothstep(core, radius, dist) > threshold;
          }
          const visible = develop >= 1 || threshold * 0.75 + rowBias < p * 1.001;
          const on = dots[i] && visible && !inLens;
          d[o] = r;
          d[o + 1] = g;
          d[o + 2] = b;
          d[o + 3] = on ? 255 : 0;
          l[o + 3] = inLens ? 255 : 0;
          if (inLens) anyLens = true;
        }
      }

      dotCtx.putImageData(dotImage, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      if (anyLens && photo) {
        lensCtx.putImageData(lensImage, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(lensLayer, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.drawImage(dotLayer, 0, 0, canvas.width, canvas.height);
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
        // Critically-damped-ish springs: position is snappy, radius a bit softer.
        const k = 260;
        const c = 2 * Math.sqrt(k) * 0.9;
        const ax = k * (lens.tx - lens.x) - c * lens.vx;
        const ay = k * (lens.ty - lens.y) - c * lens.vy;
        lens.vx += ax * dt;
        lens.vy += ay * dt;
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

      draw();
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
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * grid.cols,
        y: ((e.clientY - rect.top) / rect.height) * grid.rows,
      };
    };

    let releaseTimer = 0;
    const onEnter = (e: PointerEvent) => {
      loadPhoto();
      const pt = toGrid(e);
      if (!pt || !grid) return;
      // Start the lens where the pointer entered so it doesn't fly in from 0,0.
      if (lens.r < 0.5) {
        lens.x = lens.tx = pt.x;
        lens.y = lens.ty = pt.y;
      }
      lens.tr = grid.cols * LENS_RADIUS;
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
    const close = () => {
      lens.tr = 0;
      kick();
    };
    // Touch fires pointerleave straight after pointerup; let onUp's timer close the lens instead.
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") close();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      clearTimeout(releaseTimer);
      onEnter(e);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      releaseTimer = window.setTimeout(close, 450);
    };

    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);

    let resizeRaf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(layout);
    });
    const themeObserver = new MutationObserver(() => layout());
    let started = false;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started && grid) {
        started = true;
        wrap.dataset.ready = "true";
        kick();
      }
    });

    Promise.all([loadChannel(LUMA_SRC), loadChannel(MASK_SRC)])
      .then(([luma, mask]) => {
        if (disposed) return;
        source = { luma, mask };
        layout();
        ro.observe(wrap);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        io.observe(wrap);
        // Warm the photo once the page has settled, so the first hover is instant.
        const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
        idle(loadPhoto);
      })
      .catch(() => {
        // Static fallback stays visible.
        wrap.dataset.ready = "failed";
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      clearTimeout(releaseTimer);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div ref={wrapRef} role="img" aria-label={alt} className={`portrait relative grid aspect-[4/5] touch-pan-y place-items-center text-accent select-none ${className}`}>
      <div className="portrait-static absolute inset-0" aria-hidden />
      <canvas ref={canvasRef} className="portrait-canvas col-start-1 row-start-1" aria-hidden />
    </div>
  );
}
