// Generates every optimised asset in /public from the originals in /assets/source.
// Run with:  node --experimental-strip-types scripts/build-assets.ts
//
// Cloudflare Pages can't resize images at request time, so all images are
// pre-sized here and served as static AVIF/WebP with <picture>.
import { mkdir } from "node:fs/promises";
import sharp, { type Region } from "sharp";
import { atkinson, haloFromMask } from "../src/lib/dither.ts";

const SRC = "assets/source";
const OUT = "public";

// ── Portrait ──────────────────────────────────────────────────────────────
// 4:5 head-and-shoulders crop of me.png (600×800). me-mask.png is a one-off
// subject mask made with rembg (see scripts/portrait-mask.py).
const CROP = { left: 130, top: 232, width: 360, height: 450 };
// Luma map resolution shipped to the browser. The canvas resamples it to
// whatever grid fits the element, so this just needs to exceed the densest grid.
const LUMA_W = 240;
const LUMA_H = 300;
// Static (no-JS / pre-hydration) fallback: grid size and pixels per dot.
const STATIC_W = 160;
const STATIC_H = 200;
const STATIC_SCALE = 3;

async function grey(file: string, w: number, h: number, sharpen = false) {
  let img = sharp(`${SRC}/${file}`).extract(CROP).greyscale();
  if (sharpen) img = img.sharpen({ sigma: 1.6, m1: 0.8, m2: 2.2 });
  const { data } = await img.resize(w, h, { kernel: "lanczos3" }).raw().toBuffer({ resolveWithObject: true });
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = data[i] / 255;
  return out;
}

function percentile(values: number[], p: number) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

/** Subject: stretched + gamma-lifted so the face reads. Background: pushed darker. */
function tone(g: Float32Array, m: Float32Array) {
  const subject: number[] = [];
  for (let i = 0; i < g.length; i++) if (m[i] > 0.5) subject.push(g[i]);
  const lo = percentile(subject, 1);
  const hi = percentile(subject, 99.5);
  const out = new Float32Array(g.length);
  for (let i = 0; i < g.length; i++) {
    // Range-compressed so pure highlights (the white shirt) keep a sparse texture.
    const fg = 0.02 + 0.9 * Math.min(1, Math.max(0, (g[i] - lo) / (hi - lo))) ** 0.6;
    const bg = g[i] * 0.68;
    out[i] = fg * m[i] + bg * (1 - m[i]);
  }
  return out;
}

async function writeGrey(values: Float32Array, w: number, h: number, file: string, quality: number) {
  const buf = Buffer.alloc(w * h);
  for (let i = 0; i < buf.length; i++) buf[i] = Math.round(Math.min(1, Math.max(0, values[i])) * 255);
  await sharp(buf, { raw: { width: w, height: h, channels: 1 } }).webp({ quality }).toFile(file);
}

async function writeDots(dots: Uint8Array, w: number, h: number, file: string) {
  // White dots on transparent; used as a CSS mask so the colour follows the theme.
  const W = w * STATIC_SCALE;
  const H = h * STATIC_SCALE;
  const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!dots[Math.floor(y / STATIC_SCALE) * w + Math.floor(x / STATIC_SCALE)]) continue;
      const o = (y * W + x) * 4;
      buf[o] = buf[o + 1] = buf[o + 2] = buf[o + 3] = 255;
    }
  }
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png({ palette: true, colours: 2, compressionLevel: 9 }).toFile(file);
}

async function portrait() {
  await mkdir(`${OUT}/portrait`, { recursive: true });
  const g = await grey("me.png", LUMA_W, LUMA_H, true);
  const m = await grey("me-mask.png", LUMA_W, LUMA_H);
  const luma = tone(g, m);
  await writeGrey(luma, LUMA_W, LUMA_H, `${OUT}/portrait/luma.webp`, 90);
  await writeGrey(m, LUMA_W, LUMA_H, `${OUT}/portrait/mask.webp`, 80);

  const sg = await grey("me.png", STATIC_W, STATIC_H, true);
  const sm = await grey("me-mask.png", STATIC_W, STATIC_H);
  const sl = tone(sg, sm);
  const halo = haloFromMask(sm, STATIC_W, STATIC_H, 2);
  await writeDots(atkinson(sl, STATIC_W, STATIC_H, { halo }), STATIC_W, STATIC_H, `${OUT}/portrait/static-light.png`);
  await writeDots(atkinson(sl, STATIC_W, STATIC_H, { halo, inverse: true }), STATIC_W, STATIC_H, `${OUT}/portrait/static-dark.png`);

  // Full-colour photo revealed under the lens.
  const photo = sharp(`${SRC}/me.png`).extract(CROP).resize(480, 600, { kernel: "lanczos3" });
  await photo.clone().webp({ quality: 78 }).toFile(`${OUT}/portrait/photo.webp`);
}

// ── Project media ─────────────────────────────────────────────────────────
async function responsive(file: string, name: string, widths: number[], extract?: Region) {
  await mkdir(`${OUT}/work`, { recursive: true });
  for (const w of widths) {
    let img = sharp(`${SRC}/${file}`);
    if (extract) img = img.extract(extract);
    img = img.resize({ width: w, kernel: "lanczos3" });
    await img.clone().avif({ quality: 55, effort: 6 }).toFile(`${OUT}/work/${name}-${w}.avif`);
    await img.clone().webp({ quality: 80 }).toFile(`${OUT}/work/${name}-${w}.webp`);
  }
}

async function work() {
  await responsive("prreviewbot.png", "prreviewbot", [720, 1440]);
  // The original capture has a 75px scrollbar gutter on the right; trim it.
  await responsive("animator.jpg", "animator", [720, 1440], { left: 0, top: 0, width: 1845, height: 1080 });
  // MacroBalance: the original (photos.sharathchenna.com/Untitled%20design.mp4) is a
  // phone mockup centred on a white 1200×674 canvas. public/work/macrobalance.{webm,mp4}
  // are crops of just the screen, encoded once with:
  //   ffmpeg -i in.mp4 -an -vf "crop=248:544:476:66" -c:v libsvtav1 -crf 40 -preset 4 macrobalance.webm
  //   ffmpeg -i in.mp4 -an -vf "crop=248:544:476:66" -c:v libx264 -crf 26 -preset veryslow -movflags +faststart macrobalance.mp4
  await sharp(`${SRC}/macrobalance-poster.png`).webp({ quality: 82 }).toFile(`${OUT}/work/macrobalance-poster-248.webp`);
}

async function logos() {
  await mkdir(`${OUT}/logos`, { recursive: true });
  for (const name of ["bits", "swecha"]) {
    await sharp(`${SRC}/${name}.png`).resize(96, 96, { fit: "contain", background: "#ffffff" }).flatten({ background: "#ffffff" }).webp({ quality: 82 }).toFile(`${OUT}/logos/${name}.webp`);
  }
}

// iOS rounds the corners itself, so the touch icon is a full-bleed square.
async function icons() {
  const mark = "M0 0h4v4h-4zM8 0h4v4h-4zM4 4h4v4h-4zM12 4h4v4h-4zM0 8h4v4h-4zM8 8h4v4h-4zM12 8h4v4h-4zM4 12h4v4h-4zM8 12h4v4h-4zM12 12h4v4h-4z";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges"><rect width="32" height="32" fill="#2b35f5"/><path transform="translate(8 8)" fill="#fff" d="${mark}"/></svg>`;
  await sharp(Buffer.from(svg), { density: 600 }).resize(180, 180).png().toFile("src/app/apple-icon.png");
}

await Promise.all([portrait(), work(), logos(), icons()]);
console.log("assets built");
