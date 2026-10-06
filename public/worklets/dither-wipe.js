// CSS Paint worklet: a Bayer-dithered circular mask, used to reveal the new
// theme during the theme switch view transition. Inside `--vt-r - --vt-band`
// it's solid; across the band the cells switch on in ordered-dither order, so
// the edge of the wipe is made of the same dots as the portrait.

const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21].map((v) => (v + 0.5) / 64);

const num = (props, name, fallback) => {
  const v = parseFloat(String(props.get(name)));
  return Number.isFinite(v) ? v : fallback;
};

registerPaint(
  "dither-wipe",
  class {
    static get inputProperties() {
      return ["--vt-x", "--vt-y", "--vt-r", "--vt-band", "--vt-cell"];
    }

    paint(ctx, size, props) {
      const cx = num(props, "--vt-x", size.width / 2);
      const cy = num(props, "--vt-y", 0);
      const r = num(props, "--vt-r", 0);
      const band = num(props, "--vt-band", 160);
      const cell = num(props, "--vt-cell", 10);
      if (r <= 0) return;

      const inner = r - band;
      const cols = Math.ceil(size.width / cell);
      const rows = Math.ceil(size.height / cell);
      ctx.fillStyle = "#000";
      ctx.beginPath();

      for (let row = 0; row < rows; row++) {
        const y = (row + 0.5) * cell - cy;
        if (Math.abs(y) > r) continue;
        const outerHalf = Math.sqrt(r * r - y * y);
        const innerHalf = inner > Math.abs(y) ? Math.sqrt(inner * inner - y * y) : -1;

        // Solid span: one rect for every cell whose centre is inside the core.
        let solidFrom = cols;
        let solidTo = -1;
        if (innerHalf > 0) {
          solidFrom = Math.max(0, Math.ceil((cx - innerHalf) / cell - 0.5));
          solidTo = Math.min(cols - 1, Math.floor((cx + innerHalf) / cell - 0.5));
          if (solidTo >= solidFrom) ctx.rect(solidFrom * cell, row * cell, (solidTo - solidFrom + 1) * cell, cell);
        }

        // Dithered band on either side of it.
        const from = Math.max(0, Math.floor((cx - outerHalf) / cell));
        const to = Math.min(cols - 1, Math.ceil((cx + outerHalf) / cell));
        for (let col = from; col <= to; col++) {
          if (col >= solidFrom && col <= solidTo) {
            col = solidTo;
            continue;
          }
          const x = (col + 0.5) * cell - cx;
          const dist = Math.sqrt(x * x + y * y);
          if (dist > r) continue;
          const t = (r - dist) / band; // 0 at the outer edge, 1 at the core
          if (t > BAYER[(row & 7) * 8 + (col & 7)]) ctx.rect(col * cell, row * cell, cell, cell);
        }
      }
      ctx.fill();
    }
  },
);
