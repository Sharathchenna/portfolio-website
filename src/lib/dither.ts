// Pure, DOM-free dithering helpers. Shared by the hero canvas (browser) and
// scripts/build-assets.ts (Node), so the static fallback and the live render
// are pixel-identical at the same grid size.

/** 8×8 Bayer matrix, normalised to (0, 1). Used for the lens edge and the develop-in. */
export const BAYER_8 = (() => {
  const base = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
  ];
  const out = new Float32Array(64);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) out[y * 8 + x] = (base[y][x] + 0.5) / 64;
  return out;
})();

export const bayer = (x: number, y: number) => BAYER_8[(y & 7) * 8 + (x & 7)];

/**
 * Halo = cells just outside the subject mask. They are forced to "paper" so the
 * figure reads as a cut-out against the dense background, in both themes.
 */
export function haloFromMask(mask: Float32Array, w: number, h: number, radius: number) {
  const inside = new Uint8Array(w * h);
  for (let i = 0; i < inside.length; i++) inside[i] = mask[i] > 0.5 ? 1 : 0;
  const halo = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (inside[i]) continue;
      search: for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w || dx * dx + dy * dy > radius * radius) continue;
          if (inside[yy * w + xx]) {
            halo[i] = 1;
            break search;
          }
        }
      }
    }
  }
  return halo;
}

/**
 * Atkinson error diffusion. Returns 1 where a dot is drawn.
 * `inverse` draws dots for light tones (dark theme), so the portrait stays a
 * positive image whichever colour the paper is.
 */
export function atkinson(
  luma: Float32Array,
  w: number,
  h: number,
  { inverse = false, halo }: { inverse?: boolean; halo?: Uint8Array } = {},
) {
  const v = new Float32Array(luma.length);
  for (let i = 0; i < v.length; i++) {
    const l = halo && halo[i] ? 1 : luma[i];
    v[i] = inverse ? 1 - l : l;
  }
  const dots = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = v[i];
      const next = old > 0.5 ? 1 : 0;
      dots[i] = next === 0 && !(halo && halo[i]) ? 1 : 0;
      const err = (old - next) / 8;
      if (x + 1 < w) v[i + 1] += err;
      if (x + 2 < w) v[i + 2] += err;
      if (y + 1 < h) {
        if (x > 0) v[i + w - 1] += err;
        v[i + w] += err;
        if (x + 1 < w) v[i + w + 1] += err;
      }
      if (y + 2 < h) v[i + 2 * w] += err;
    }
  }
  return dots;
}

/** Area-average resample of a single-channel float image (downscaling only). */
export function resample(src: Float32Array, sw: number, sh: number, dw: number, dh: number) {
  const out = new Float32Array(dw * dh);
  const fx = sw / dw;
  const fy = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * fy);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * fy));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * fx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * fx));
      let sum = 0;
      let n = 0;
      for (let yy = y0; yy < y1 && yy < sh; yy++) {
        for (let xx = x0; xx < x1 && xx < sw; xx++) {
          sum += src[yy * sw + xx];
          n++;
        }
      }
      out[y * dw + x] = n ? sum / n : 0;
    }
  }
  return out;
}

/** Develop-in key: Bayer order, biased top-down, so cells dissolve in as a sweep. */
export const developKey = (x: number, y: number, rows: number) => bayer(x, y) * 0.75 + (y / rows) * 0.25;

/** Dot cells sorted by when they appear during the develop-in, plus their keys. */
export function buildOrder(dots: Uint8Array, cols: number, rows: number) {
  let n = 0;
  for (let i = 0; i < dots.length; i++) n += dots[i];
  const order = new Int32Array(n);
  const allKeys = new Float32Array(dots.length);
  for (let i = 0, k = 0; i < dots.length; i++) {
    if (!dots[i]) continue;
    allKeys[i] = developKey(i % cols, (i / cols) | 0, rows);
    order[k++] = i;
  }
  order.sort((a, b) => allKeys[a] - allKeys[b]);
  const keys = new Float32Array(n);
  for (let k = 0; k < n; k++) keys[k] = allKeys[order[k]];
  return { order, keys };
}

export type Channel = { data: Float32Array; w: number; h: number };
export type DitherRequest = { id: number; cols: number; rows: number; dark: boolean; luma: string; mask: string };
export type DitherResult = { id: number; cols: number; rows: number; dots: Uint8Array; order: Int32Array; keys: Float32Array };

/** Everything between "source maps" and "dots to draw" for one grid size and theme. */
export function ditherGrid(src: { luma: Channel; mask: Channel }, cols: number, rows: number, dark: boolean) {
  const luma = resample(src.luma.data, src.luma.w, src.luma.h, cols, rows);
  const mask = resample(src.mask.data, src.mask.w, src.mask.h, cols, rows);
  const halo = haloFromMask(mask, cols, rows, Math.max(1, Math.round(cols / 85)));
  const dots = atkinson(luma, cols, rows, { halo, inverse: dark });
  return { dots, ...buildOrder(dots, cols, rows) };
}

/** Red channel of an RGBA buffer, as 0–1 floats. */
export function redChannel(rgba: Uint8ClampedArray, w: number, h: number): Channel {
  const data = new Float32Array(w * h);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4] / 255;
  return { data, w, h };
}
