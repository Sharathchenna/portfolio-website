import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([".next/**", ".vercel/**", "public/**"]),
  {
    rules: {
      // Images are pre-sized AVIF/WebP (scripts/build-assets.ts); next/image can't optimise on Cloudflare Pages.
      "@next/next/no-img-element": "off",
    },
  },
]);
