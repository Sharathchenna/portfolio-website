import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@/components/icons";
import { getPost, getSlugs } from "@/data/blog";
import { DATA } from "@/data/resume";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  const { title, publishedAt, summary, image } = post.metadata;
  const images = image ? [{ url: image }] : undefined; // falls back to the site OG image
  return {
    title,
    description: summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title, description: summary, type: "article", publishedTime: publishedAt, url: `/blog/${post.slug}`, images },
    twitter: { card: "summary_large_image", title, description: summary, images },
  };
}

export default async function BlogPost({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const { title, publishedAt, summary, image } = post.metadata;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    datePublished: publishedAt,
    dateModified: publishedAt,
    description: summary,
    image: image ? `${DATA.url}${image}` : `${DATA.url}/opengraph-image.png`,
    url: `${DATA.url}/blog/${post.slug}`,
    author: { "@type": "Person", name: DATA.name, url: DATA.url },
  };

  return (
    <article className="container-site pt-12 md:pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[68ch]">
        <Link href="/blog" className="label group inline-flex items-center gap-2 text-ink-2 hover:text-ink" data-intro="fade">
          <ArrowRight width={12} height={12} className="rotate-180 transition-transform duration-(--dur-base) ease-(--ease-out) group-hover:-translate-x-1" />
          All writing
        </Link>
        <header className="mt-10 border-b border-line pb-10">
          <time dateTime={publishedAt} className="label text-ink-2" data-intro style={{ "--d": 1 } as React.CSSProperties}>
            {formatDate(publishedAt)}
          </time>
          <h1 className="headline mt-4 text-headline" data-intro style={{ "--d": 2 } as React.CSSProperties}>
            {title}
          </h1>
          {summary && (
            <p className="mt-5 text-lead text-ink-2" data-intro style={{ "--d": 3 } as React.CSSProperties}>
              {summary}
            </p>
          )}
        </header>
        <div className="prose mt-10" data-intro style={{ "--d": 4 } as React.CSSProperties} dangerouslySetInnerHTML={{ __html: post.source }} />
      </div>
    </article>
  );
}
