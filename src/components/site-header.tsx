import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import { Mark } from "@/components/mark";
import { CommandMenuTrigger } from "@/components/command-menu";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme";
import { DATA } from "@/data/resume";

// Contact and résumé live in the header on every page: one click from anywhere.
export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-40 bg-paper">
      <nav aria-label="Primary" className="container-site flex h-14 items-center justify-between gap-4 md:h-16">
        <Link href="/" className="group -mx-1 flex items-center gap-2.5 rounded-sm px-1 py-1 text-ink" aria-label={`${DATA.name}, home`}>
          <Mark size={16} className="text-accent transition-transform duration-(--dur-slow) ease-(--ease-spring) group-hover:rotate-90" />
          <span className="headline text-base leading-none tracking-[-0.02em] whitespace-nowrap md:text-[1.0625rem]">{DATA.name}</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-8">
          <SiteNav />
          <div className="flex items-center gap-1.5 md:gap-2">
            <a
              href={DATA.resume}
              target="_blank"
              rel="noopener"
              className="btn btn-ghost min-h-9 gap-1.5 px-3 text-[0.8125rem] md:px-3.5"
            >
              <span className="md:hidden">CV</span>
              <span className="hidden md:inline">Résumé</span>
              <span className="sr-only">(PDF, opens in a new tab)</span>
              <ArrowUpRight data-arrow="up-right" width={14} height={14} />
            </a>
            <Link href="/#contact" className="btn btn-primary min-h-9 px-3.5 text-[0.8125rem]">
              Contact
            </Link>
            <CommandMenuTrigger className="hidden h-9 place-items-center rounded-full px-2.5 text-ink-2 transition-colors duration-(--dur-fast) hover:bg-paper-2 hover:text-ink lg:grid" />
            <ThemeToggle className="-mr-2" />
          </div>
        </div>
      </nav>
    </header>
  );
}
