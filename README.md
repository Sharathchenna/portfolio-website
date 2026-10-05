# sharathchenna.com

Personal site of Sharath Chenna: software engineer building AI products.

Built with Next.js 16 (App Router), React 19.3 and Tailwind CSS 4, and deployed to Cloudflare Pages. It uses no animation libraries: motion is CSS (including scroll-driven animations), the View Transitions API, and a hand-written `<canvas>`.

## Editing content

Everything a visitor reads comes from **[`src/data/resume.ts`](./src/data/resume.ts)**: name, headline, availability line, projects, experience, education and skills. The homepage, `/resume` and the JSON-LD structured data all render from it.

- **Availability**: `DATA.availability` (shown in the hero status line and footer).
- **Offline project links**: hosts listed in `DATA.offlineHosts` render as plain text instead of links. Remove a host once its site is back up.
- **Blog posts**: Markdown files in [`content/`](./content) with `title`, `publishedAt` and `summary` front matter.

After changing résumé content, regenerate the PDF (see below).

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run lint
npm run assets       # rebuild every optimised image in /public from /assets/source
npm run deploy       # next-on-pages build + wrangler pages deploy
```

### Generated files

| File | Source | How to regenerate |
| --- | --- | --- |
| `public/portrait/*`, `public/work/*`, `public/logos/*`, `src/app/apple-icon.png` | `assets/source/*` | `npm run assets` |
| `assets/source/me-mask.png` | `assets/source/me.png` | `python scripts/portrait-mask.py` (needs `rembg`) |
| `public/sharath-chenna-resume.pdf` | the `/resume` page | Start a server, then `npx -y -p playwright@1 node scripts/resume-pdf.mjs http://localhost:3000` |
| `src/app/opengraph-image.png`, `twitter-image.png` | the live homepage styles | `npx -y -p playwright@1 node scripts/og-image.mjs http://localhost:3000`, then copy to `twitter-image.png` |
| `public/work/macrobalance.{webm,mp4}` | original screen recording | ffmpeg commands in `scripts/build-assets.ts` |

## How it's built

- **Design tokens** live at the top of [`src/app/globals.css`](./src/app/globals.css): colour (WCAG-checked pairs for light and dark), a fluid type scale, radius, shadow and spacing, plus motion durations and easings (including `linear()` springs).
- **Fonts**: Bricolage Grotesque (variable weight, width and optical size) via `next/font`, and Departure Mono (SIL OFL, self-hosted) for labels.
- **Hero portrait** ([`dither-portrait.tsx`](./src/components/dither-portrait.tsx)):
  - Rendered as an Atkinson dither of a 26 KB greyscale map, computed in a Web Worker ([`dither.worker.ts`](./src/lib/dither.worker.ts)).
  - Drawn at one pixel per dot and upscaled by the compositor.
  - A pointer lens with a Bayer-dithered edge reveals the photo underneath.
  - A static dithered PNG (used as a CSS mask) covers no-JS visitors and the moment before hydration.
- **Review mode**: annotations that explain the build, toggled from the hero caption or footer ([`review.tsx`](./src/components/review.tsx), [`note.tsx`](./src/components/note.tsx)).
- **Reduced motion**: every animation is opt-in behind `prefers-reduced-motion: no-preference`. Content is never hidden waiting for an animation or for JavaScript.
- **Images**: Cloudflare Pages can't run the Next.js image optimiser, so images are pre-sized AVIF/WebP served through `<picture>`.

## Contact form

`POST /api/contact` (edge runtime) sends mail through the Resend REST API. See [SETUP.md](./SETUP.md) for the environment variables. Without `RESEND_API_KEY` in production, the endpoint returns 503 and the form tells the visitor to email directly, so no message is ever silently dropped.

## Licence

[MIT](./LICENSE). Departure Mono is © Helena Zhang, [SIL OFL 1.1](./src/app/fonts/DepartureMono-LICENSE.txt).
