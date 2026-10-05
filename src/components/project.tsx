import { BrowserFrame } from "@/components/browser-frame";
import { Apple, ArrowUpRight, GitHub, Globe } from "@/components/icons";
import { Note } from "@/components/note";
import { PhoneVideo } from "@/components/phone-video";
import type { LinkKind, Project } from "@/data/resume";
import { isOffline } from "@/lib/utils";

const LINK_ICON: Record<LinkKind, typeof Globe> = { website: Globe, appstore: Apple, github: GitHub };

export function ProjectRow({ project, index, total }: { project: Project; index: number; total: number }) {
  const links = project.links.filter((l) => !isOffline(l.href));
  const id = `project-${project.slug}`;
  const { media } = project;

  return (
    <article aria-labelledby={id} className="grid grid-cols-12 gap-x-6 gap-y-10 py-12 lg:py-20">
      <div className="col-span-12 flex flex-col lg:col-span-5">
        <p className="label flex items-center justify-between text-ink-2" data-reveal>
          <span>
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          {project.active && (
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden /> Active
            </span>
          )}
        </p>
        <h3 id={id} className="headline mt-6 text-title" data-reveal>
          {project.title}
        </h3>
        <p className="mt-3 text-lead text-ink" data-reveal>
          {project.tagline}
        </p>
        <p className="mt-5 max-w-[54ch] text-ink-2" data-reveal>
          {project.description}
        </p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Highlights" data-reveal>
          {project.metrics.map((m) => (
            <li key={m} className="label rounded-full border border-line px-2.5 py-1 text-ink normal-case">
              {m}
            </li>
          ))}
        </ul>
        <p className="label mt-6 text-ink-2" data-reveal>
          <span className="sr-only">Built with: </span>
          {project.technologies.join(" / ")}
        </p>
        {links.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2" data-reveal>
            {links.map((l) => {
              const Icon = LINK_ICON[l.kind];
              return (
                <a key={l.href} href={l.href} target="_blank" rel="noopener" className="btn btn-ghost min-h-10 px-4">
                  <Icon width={15} height={15} />
                  {l.kind === "appstore" ? "App Store" : l.kind === "github" ? "Source on GitHub" : "Visit site"}
                  <ArrowUpRight data-arrow="up-right" width={14} height={14} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative col-span-12 lg:col-span-7" data-annotated={media.kind === "phone-video" || undefined}>
        <div
          className="stage grid min-h-[22rem] place-items-center overflow-hidden rounded-lg px-5 py-10 sm:px-10 lg:aspect-[5/4] lg:min-h-0 lg:p-14"
          data-reveal="media"
        >
          <div className={`device ${media.kind === "browser-image" ? "w-full" : ""}`}>
            {media.kind === "phone-video" ? (
              <PhoneVideo {...media} label={`Screen recording of ${project.title}: logging a meal by photo`} />
            ) : (
              <BrowserFrame src={media.src} width={media.width} height={media.height} url={media.url} alt={`${project.title} landing page`} />
            )}
          </div>
        </div>
        {media.kind === "phone-video" && (
          <Note n={5} title="Media budget" place="top-right">
            The original 476 KB clip was cropped to just the phone screen and re-encoded: 143 KB AV1 with an H.264 fallback. Nothing loads until it scrolls near, it pauses off-screen, and it never autoplays if you prefer reduced motion.
          </Note>
        )}
      </div>
    </article>
  );
}
