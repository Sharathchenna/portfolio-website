// Renders src/app/opengraph-image.png (1200×630) using the live site's fonts,
// tokens and dithered portrait. Needs a running server and Playwright:
//   npx -y -p playwright@1 node scripts/og-image.mjs http://localhost:3100
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3100";
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: "light" });
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.documentElement.classList.remove("dark");
  document.body.className = "";
  document.body.innerHTML = `
  <div style="position:fixed;inset:0;display:grid;grid-template-columns:1fr 372px;gap:56px;padding:56px 64px;background:var(--paper);color:var(--ink)">
    <div style="display:flex;flex-direction:column">
      <p class="label" style="display:flex;align-items:center;gap:10px;color:var(--ink-2)">
        <svg viewBox="0 0 16 16" width="14" height="14" shape-rendering="crispEdges" style="color:var(--accent)"><path fill="currentColor" d="M0 0h4v4h-4zM8 0h4v4h-4zM4 4h4v4h-4zM12 4h4v4h-4zM0 8h4v4h-4zM8 8h4v4h-4zM12 8h4v4h-4zM4 12h4v4h-4zM8 12h4v4h-4zM12 12h4v4h-4z"/></svg>
        sharathchenna.com
      </p>
      <h1 class="display-tight" style="margin-top:36px;font-size:150px;line-height:.82;letter-spacing:-.042em">Sharath<br/>Chenna</h1>
      <p style="margin-top:34px;font-size:30px;line-height:1.25;max-width:21ch">Software engineer shipping AI products, end to end.</p>
      <p class="label" style="margin-top:auto;color:var(--ink-2)">MacroBalance · PRReviewBot · Animator.chat</p>
    </div>
    <div style="color:var(--accent);position:relative">
      <div class="portrait-static" style="position:absolute;inset:0;opacity:1;animation:none"></div>
    </div>
  </div>`;
});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: "src/app/opengraph-image.png" });
await browser.close();
console.log("wrote src/app/opengraph-image.png");
