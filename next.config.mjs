import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

// Lets `next dev` use Cloudflare bindings, see
// https://github.com/cloudflare/next-on-pages/blob/5712c57ea7/internal-packages/next-dev/README.md
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  // Images are pre-sized to AVIF/WebP by scripts/build-assets.ts: Cloudflare
  // Pages can't run the Next.js image optimiser.
  images: { unoptimized: true },
};

export default nextConfig;
