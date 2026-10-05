import Link from "next/link";
import { ArrowRight } from "@/components/icons";

export default function NotFound() {
  return (
    <section className="container-site grid min-h-[60vh] content-center pt-16">
      <p className="label text-ink-2" data-intro="fade">Error 404</p>
      <h1 className="display-tight mt-4 text-display" data-intro="line" style={{ "--d": 1 } as React.CSSProperties}>
        Not found.
      </h1>
      <p className="mt-6 max-w-[40ch] text-lead text-ink-2" data-intro style={{ "--d": 2 } as React.CSSProperties}>
        This page didn&apos;t pass review. It may have moved, or never existed.
      </p>
      <div className="mt-8 flex flex-wrap gap-3" data-intro style={{ "--d": 3 } as React.CSSProperties}>
        <Link href="/" className="btn btn-primary">
          Back to the homepage <ArrowRight data-arrow="right" />
        </Link>
        <Link href="/#contact" className="btn btn-ghost">
          Contact me
        </Link>
      </div>
    </section>
  );
}
