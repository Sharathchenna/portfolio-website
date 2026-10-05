import type { Metadata } from "next";
import { ArrowDown } from "@/components/icons";
import { DATA } from "@/data/resume";
import { isOffline } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Résumé",
  description: `Résumé of ${DATA.name}: ${DATA.role.toLowerCase()} building AI products.`,
  alternates: { canonical: "/resume" },
};

const host = (href: string) => href.replace(/^https?:\/\//, "").replace(/\/$/, "");

// Rendered from the same data as the homepage, typeset for A4. The PDF in
// /public is printed from this page (see scripts/resume-pdf.mjs).
export default function ResumePage() {
  const summary = DATA.summary.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return (
    <div className="container-site pt-10 md:pt-16 print:p-0">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <p className="label text-ink-2">Résumé · also available as a PDF</p>
        <a href={DATA.resume} download className="btn btn-primary">
          Download PDF <ArrowDown data-arrow="down" />
        </a>
      </div>

      <article className="resume mx-auto max-w-[52rem] rounded-lg bg-paper-2/60 p-6 ring-1 ring-line sm:p-12 print:max-w-none print:rounded-none print:bg-transparent print:p-0 print:ring-0">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-6">
          <div>
            <h1 className="display-tight text-[clamp(2.75rem,2rem+3vw,4rem)] leading-[0.85] tracking-[-0.045em]">{DATA.name}</h1>
            <p className="mt-3 text-lg">{DATA.role} · {DATA.location}</p>
          </div>
          <ul className="label space-y-1 text-right text-ink-2 normal-case">
            <li><a href={`mailto:${DATA.contact.email}`}>{DATA.contact.email}</a></li>
            <li><a href={DATA.url}>sharathchenna.com</a></li>
            <li><a href={DATA.contact.social.GitHub.canonical}>github.com/sharathchenna</a></li>
          </ul>
        </header>

        <section className="resume-section">
          <h2>Summary</h2>
          <div>
            <p className="font-medium">{DATA.headline}</p>
            <p className="mt-3 text-ink-2">{summary}</p>
          </div>
        </section>

        <section className="resume-section">
          <h2>Experience</h2>
          <div>
            {DATA.work.map((w) => (
              <div key={w.company} className="resume-item">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3>{w.title} · {w.company}</h3>
                  <p className="label text-ink-2">{w.start} — {w.end} · {w.location}</p>
                </div>
                <ul className="mt-2 list-[square] space-y-1 pl-5 marker:text-accent">
                  {w.highlights.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-section">
          <h2>Projects</h2>
          <div>
            {DATA.projects.map((p) => {
              const live = p.links.filter((l) => !isOffline(l.href));
              return (
                <div key={p.slug} className="resume-item">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3>{p.title} — <span className="font-normal">{p.tagline}</span></h3>
                    {live[0] && <a className="label text-ink-2 normal-case" href={live[0].href}>{host(live[0].href)}</a>}
                  </div>
                  <p className="mt-1.5 text-ink-2">{p.description}</p>
                  <p className="label mt-2 text-ink-2">{p.technologies.join(" · ")}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="resume-section">
          <h2>Education</h2>
          <div>
            {DATA.education.map((e) => (
              <div key={e.school} className="resume-item flex flex-wrap items-baseline justify-between gap-x-4">
                <div>
                  <h3>{e.school}</h3>
                  <p className="text-ink-2">{e.degree}</p>
                </div>
                <p className="label text-ink-2">{e.start} — {e.end}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-section">
          <h2>Skills</h2>
          <p>{DATA.skills.join(", ")}</p>
        </section>
      </article>
    </div>
  );
}
