import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "@/components/icons";
import { Mark } from "@/components/mark";
import { Note } from "@/components/note";
import { ReviewToggle } from "@/components/review";
import { Vitals } from "@/components/vitals";
import { DATA } from "@/data/resume";

export function SiteFooter() {
  const socials = Object.values(DATA.contact.social);
  return (
    <footer className="container-site mt-section pb-8">
      <div className="rule" data-reveal="draw" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 pt-10 md:grid-cols-12">
        <div className="col-span-2 md:col-span-4">
          <p className="flex items-center gap-2.5">
            <Mark className="text-accent" />
            <span className="headline text-lg leading-none">{DATA.name}</span>
          </p>
          <p className="mt-3 max-w-[30ch] text-sm text-ink-2">
            {DATA.role} in {DATA.location}. {DATA.availability}.
          </p>
        </div>
        <nav aria-label="Footer" className="md:col-span-2">
          <h2 className="label text-ink-2">Site</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><Link className="link-draw" href="/#work">Work</Link></li>
            <li><Link className="link-draw" href="/#about">About</Link></li>
            <li><Link className="link-draw" href="/blog">Writing</Link></li>
            <li><a className="link-draw" href={DATA.resume} target="_blank" rel="noopener">Résumé (PDF)</a></li>
          </ul>
        </nav>
        <div className="md:col-span-2">
          <h2 className="label text-ink-2">Elsewhere</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><a className="link-draw" href={`mailto:${DATA.contact.email}`}>Email</a></li>
            {socials.map((s) => (
              <li key={s.name}>
                <a className="link-draw inline-flex items-center gap-1" href={s.url} target="_blank" rel="noopener me">
                  {s.name}
                  <ArrowUpRight width={12} height={12} className="text-ink-2" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-2 md:col-span-4">
          <h2 className="label text-ink-2">Colophon</h2>
          <p className="mt-3 max-w-[42ch] text-sm text-ink-2">
            Set in Bricolage Grotesque and Departure Mono. The portrait is dithered live in a canvas; motion is plain CSS and the View Transitions API, with no animation libraries.
          </p>
          <ReviewToggle className="btn btn-ghost mt-5 min-h-9 px-3.5 text-[0.8125rem]" />
        </div>
      </div>
      <div className="mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t border-line pt-5 sm:flex-row sm:items-center">
        <p className="label text-ink-2">© {new Date().getFullYear()} {DATA.name}</p>
        <div className="relative" data-annotated>
          <Vitals />
          <Note n={8} title="Measured, not claimed" place="above">
            These numbers come from PerformanceObserver in your browser, for this visit, right now.
          </Note>
        </div>
        <a href="#main" className="label inline-flex items-center gap-1.5 text-ink-2 transition-colors hover:text-ink">
          Back to top <ArrowUp width={12} height={12} />
        </a>
      </div>
    </footer>
  );
}
