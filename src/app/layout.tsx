import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";
import { ViewTransition } from "react";
import { SiteFooter } from "@/components/site-footer";
import { ReviewBar } from "@/components/review";
import { SiteHeader } from "@/components/site-header";
import { themeScript } from "@/components/theme";
import { DATA } from "@/data/resume";
import "./globals.css";

// Variable display + text face: weight, width and optical-size axes in one file.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

// Bitmap mono for labels and metadata, drawn on an 11px grid (SIL OFL).
const departure = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

const title = `${DATA.name} — Software engineer building AI products`;

export const metadata: Metadata = {
  metadataBase: new URL(DATA.url),
  title: { default: title, template: `%s — ${DATA.name}` },
  description: DATA.description,
  applicationName: DATA.name,
  authors: [{ name: DATA.name, url: DATA.url }],
  creator: DATA.name,
  openGraph: {
    title,
    description: DATA.description,
    url: DATA.url,
    siteName: DATA.name,
    locale: "en_US",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description: DATA.description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f1eee7",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${departure.variable}`}>
      <body className="flex min-h-dvh flex-col">
        {/* Blocking on purpose: sets the theme before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <ViewTransition default="page">
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
        </ViewTransition>
        <SiteFooter />
        <ReviewBar />
      </body>
    </html>
  );
}
