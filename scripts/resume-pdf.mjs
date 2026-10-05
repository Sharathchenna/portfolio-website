// Prints /resume to public/sharath-chenna-resume.pdf with headless Chromium.
// Needs a running server and Playwright:
//   npm run build && npx next start -p 3100 &
//   npx -y -p playwright@1 node scripts/resume-pdf.mjs http://localhost:3100
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3100";
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ colorScheme: "light" });
await page.goto(`${base}/resume`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.emulateMedia({ media: "print", colorScheme: "light" });
await page.pdf({ path: "public/sharath-chenna-resume.pdf", format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
await browser.close();
console.log("wrote public/sharath-chenna-resume.pdf");
