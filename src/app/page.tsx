import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ContactForm } from "@/components/contact-form";
import { CopyEmail } from "@/components/copy-email";
import { DitherPortrait } from "@/components/dither-portrait";
import { ArrowRight, ArrowUpRight, SOCIAL_ICONS } from "@/components/icons";
import { LocalTime } from "@/components/local-time";
import { Note } from "@/components/note";
import { ProjectRow } from "@/components/project";
import { ReviewToggle } from "@/components/review";
import { DATA } from "@/data/resume";
import { parseInlineLinks } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const d = (n: number) => ({ "--d": n }) as CSSProperties;

const FACTS = [
  { term: "Active users", value: "250+", detail: "on MacroBalance, live on the App Store" },
  { term: "AI products shipped", value: "3", detail: "MacroBalance, PRReviewBot and Animator.chat" },
  { term: "Open source", value: "SSO", detail: "built for Swecha Telangana's platforms" },
  { term: "Education", value: "BITS ’27", detail: "M.Sc. Mathematics + B.E. Chemical Engineering" },
];

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="label flex items-center gap-3 text-ink-2">
      <span className="text-accent">({n})</span>
      {children}
    </p>
  );
}

export default function Home() {
  const socials = Object.values(DATA.contact.social);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: DATA.name,
    url: DATA.url,
    email: `mailto:${DATA.contact.email}`,
    jobTitle: DATA.role,
    description: DATA.description,
    image: `${DATA.url}/opengraph-image.png`,
    address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressCountry: "IN" },
    alumniOf: { "@type": "CollegeOrUniversity", name: DATA.education[0].school },
    knowsAbout: DATA.skills,
    sameAs: [DATA.contact.social.GitHub.canonical],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="hero-title" className="container-site pt-6 md:pt-10">
        <div className="label flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-ink-2" data-intro="fade" style={d(0)}>
          <p className="flex items-center gap-2 text-ink">
            <span className="status-dot" aria-hidden />
            {DATA.availability}
          </p>
          <p>
            Hyderabad, IN · <LocalTime /> IST
          </p>
        </div>

        <div className="mt-8 grid grid-cols-12 gap-x-6 gap-y-12 md:mt-12 lg:mt-16">
          <div className="@container col-span-12 flex flex-col md:col-span-7 lg:col-span-8">
            <div className="relative self-start" data-annotated>
              {/* Sized to its column (container query), so the name always fills it. */}
              <h1 id="hero-title" className="display-tight text-[clamp(4.5rem,33cqi,13.5rem)] leading-[0.82] tracking-[-0.042em] text-ink">
                <span className="block" data-intro="nudge" style={d(0)}>
                  Sharath
                </span>
                <span className="block" data-intro="nudge" style={d(1)}>
                  Chenna
                </span>
              </h1>
              <Note n={1} title="Performance" place="right">
                Your name should load before anything else. This headline is plain HTML text in a self-hosted variable font: it paints before any JavaScript runs.
              </Note>
            </div>

            <p className="mt-8 max-w-[34ch] text-lead text-ink md:mt-10" data-intro style={d(4)}>
              {DATA.headline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3" data-intro style={d(5)}>
              <Link href="#contact" className="btn btn-primary">
                Get in touch
                <ArrowRight data-arrow="right" />
              </Link>
              <a href={DATA.resume} target="_blank" rel="noopener" className="btn btn-ghost">
                Résumé
                <ArrowUpRight data-arrow="up-right" />
                <span className="sr-only">(PDF, opens in a new tab)</span>
              </a>
              <ul className="-ml-3 flex items-center gap-0.5 sm:ml-0" aria-label="Profiles">
                {socials.map((s) => {
                  const Icon = SOCIAL_ICONS[s.name as keyof typeof SOCIAL_ICONS];
                  return (
                    <li key={s.name}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener me"
                        className="grid size-11 place-items-center rounded-full text-ink-2 transition-[color,background-color] duration-(--dur-fast) hover:bg-paper-2 hover:text-ink"
                        aria-label={`${s.name} (opens in a new tab)`}
                      >
                        <Icon width={18} height={18} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <figure className="relative col-span-12 sm:col-span-8 sm:col-start-3 md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9" data-intro="fade" style={d(3)}>
            <div className="relative" data-annotated>
              <DitherPortrait alt={`Portrait of ${DATA.name}, rendered as a blue dot pattern`} />
              <Note n={2} title="The portrait" place="bottom-left">
                Atkinson-dithered in a canvas from a 26 KB greyscale map, re-dithered for each theme. Every dot is a spring: click to scatter them, or move fast and the lens shoves them aside. The loop only runs while something moves.
              </Note>
            </div>
            <figcaption className="label mt-4 flex items-start justify-between gap-4 text-ink-2">
              <span>
                Fig. 01 — Dithered live ·
                <span className="hidden pointer-fine:inline"> Hover to develop, click to scatter</span>
                <span className="pointer-fine:hidden"> Drag to develop, tap to scatter</span>
              </span>
              <ReviewToggle className="shrink-0 text-ink transition-colors hover:text-accent aria-pressed:text-accent">
                <span className="link-draw">Review</span>
              </ReviewToggle>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── At a glance ──────────────────────────────────────────────────── */}
      <section aria-label="At a glance" className="container-site mt-20 md:mt-28">
        <div className="relative" data-annotated>
          <div className="rule" data-reveal="draw" />
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {FACTS.map((f, i) => (
              <div
                key={f.term}
                className={`flex flex-col py-6 pr-4 sm:py-8 lg:px-6 ${i % 2 ? "border-l border-line pl-4 lg:pl-6" : ""} ${i > 1 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""} ${i === 0 ? "lg:pl-0" : ""}`}
                data-reveal="shift"
                style={{ "--rise": "24px" } as CSSProperties}
              >
                <dt className="label mt-4 text-ink">{f.term}</dt>
                <dd className="headline order-first text-headline leading-[0.9]">{f.value}</dd>
                <dd className="mt-1.5 max-w-[26ch] text-sm text-ink-2">{f.detail}</dd>
              </div>
            ))}
          </dl>
          <Note n={3} title="Proof before prose" place="above">
            The numbers you&apos;d want from a résumé, readable in the first scroll, without opening anything.
          </Note>
        </div>
      </section>

      {/* ── Work ─────────────────────────────────────────────────────────── */}
      <section id="work" aria-labelledby="work-title" className="container-site pt-section">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6">
          <div className="col-span-12 lg:col-span-8" data-reveal>
            <SectionLabel n="01">Selected work</SectionLabel>
            <h2 id="work-title" className="headline mt-5 text-headline">
              Products I&apos;ve designed, built and shipped.
            </h2>
          </div>
          <p className="col-span-12 max-w-[40ch] text-ink-2 lg:col-span-4 lg:justify-self-end" data-reveal>
            Three AI products, each spanning product, mobile or web front end, backend and infrastructure.
          </p>
        </div>
        <ol className="mt-10 lg:mt-14">
          {DATA.projects.map((p, i) => (
            <li key={p.slug} className="border-t border-line">
              <ProjectRow project={p} index={i} total={DATA.projects.length} />
            </li>
          ))}
        </ol>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section id="about" aria-labelledby="about-title" className="container-site pt-section">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-28" data-reveal>
              <SectionLabel n="02">About</SectionLabel>
              <h2 id="about-title" className="headline mt-5 text-headline">
                The person behind the pixels.
              </h2>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            <p className="text-lead text-ink" data-reveal>
              {parseInlineLinks(DATA.summary).map((part, i) =>
                part.href ? (
                  <a key={i} href={part.href} target="_blank" rel="noopener" className="link">
                    {part.text}
                  </a>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
            </p>

            <h3 className="label mt-16 text-ink-2" data-reveal>
              Experience
            </h3>
            <ol className="mt-4">
              {DATA.work.map((w) => (
                <li key={w.company} className="border-t border-line py-6" data-reveal>
                  <div className="flex items-start gap-4">
                    <img src={w.logoUrl} alt="" width={44} height={44} loading="lazy" className="size-11 shrink-0 rounded-sm bg-white object-contain ring-1 ring-line" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h4 className="headline text-lg leading-tight">
                          <a href={w.href} target="_blank" rel="noopener" className="link-draw">
                            {w.company}
                          </a>
                        </h4>
                        <p className="label text-ink-2">
                          {w.start} — {w.end} · {w.location}
                        </p>
                      </div>
                      <p className="text-ink-2">{w.title}</p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2 sm:pl-15">
                    {w.highlights.map((h) => (
                      <li key={h} className="flex gap-3">
                        <span className="mt-[0.7em] size-1 shrink-0 bg-accent" aria-hidden />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-ink-2 sm:pl-15">{w.description}</p>
                </li>
              ))}
            </ol>

            <h3 className="label mt-14 text-ink-2" data-reveal>
              Education
            </h3>
            <ol className="mt-4">
              {DATA.education.map((e) => (
                <li key={e.school} className="flex items-start gap-4 border-t border-line py-6" data-reveal>
                  <img src={e.logoUrl} alt="" width={44} height={44} loading="lazy" className="size-11 shrink-0 rounded-sm bg-white object-contain ring-1 ring-line" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h4 className="headline text-lg leading-tight">
                        <a href={e.href} target="_blank" rel="noopener" className="link-draw">
                          {e.school}
                        </a>
                      </h4>
                      <p className="label text-ink-2">
                        {e.start} — {e.end}
                      </p>
                    </div>
                    <p className="text-ink-2">{e.degree}</p>
                  </div>
                </li>
              ))}
            </ol>

            <h3 className="label mt-14 text-ink-2" data-reveal>
              Toolbox
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2 border-t border-line pt-6" data-reveal>
              {DATA.skills.map((s) => (
                <li key={s} className="rounded-full border border-line px-3.5 py-1.5 text-sm">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section id="contact" aria-labelledby="contact-title" className="container-site scroll-mt-20 pt-section">
        <div className="on-accent relative grid grid-cols-12 gap-x-6 gap-y-12 rounded-lg bg-accent p-6 text-on-accent sm:p-10 lg:p-16" data-reveal="media">
          <div className="col-span-12 flex flex-col lg:col-span-7">
            <p className="label flex items-center gap-3 opacity-80">
              <span>(03)</span> Contact
            </p>
            <h2 id="contact-title" className="headline mt-5 text-headline">
              Let&apos;s build something.
            </h2>
            <p className="mt-5 max-w-[40ch] text-lg opacity-90">Hiring, collaborating, or just curious? Ask me anything. I always respond.</p>
            <div className="relative mt-10 lg:mt-auto lg:pt-14" data-annotated>
              <CopyEmail email={DATA.contact.email} />
              <Note n={6} title="One click" place="above">
                Many recruiters don&apos;t have a desktop mail app set up, so the address copies on click. mailto is right below it.
              </Note>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <a href={`mailto:${DATA.contact.email}`} className="btn min-h-10 border border-current/30 px-3.5 text-[0.8125rem] hover:border-current">
                Open mail app <ArrowUpRight data-arrow="up-right" />
              </a>
              <a href={DATA.resume} target="_blank" rel="noopener" className="btn min-h-10 border border-current/30 px-3.5 text-[0.8125rem] hover:border-current">
                Résumé <ArrowUpRight data-arrow="up-right" />
                <span className="sr-only">(PDF, opens in a new tab)</span>
              </a>
              {socials.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener me" className="btn min-h-10 border border-current/30 px-3.5 text-[0.8125rem] hover:border-current">
                  {s.name} <ArrowUpRight data-arrow="up-right" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-md bg-paper p-6 text-ink sm:p-8">
              <h3 className="headline text-title">Or leave a note.</h3>
              <p className="mt-2 mb-6 text-sm text-ink-2">Goes straight to my inbox.</p>
              <ContactForm fallbackEmail={DATA.contact.email} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
