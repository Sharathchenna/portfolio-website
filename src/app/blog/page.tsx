import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { getBlogPosts } from "@/data/blog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Writing",
  description: "Notes on software development, building products, and more by Sharath Chenna.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <section aria-labelledby="blog-title" className="container-site pt-12 md:pt-20">
      <p className="label flex items-center gap-3 text-ink-2" data-intro="fade">
        <span className="text-accent">(✎)</span> Writing
      </p>
      <h1 id="blog-title" className="headline mt-5 max-w-[14ch] text-headline" data-intro style={{ "--d": 1 } as React.CSSProperties}>
        Notes from the workbench.
      </h1>
      <p className="mt-6 max-w-[48ch] text-lead text-ink-2" data-intro style={{ "--d": 2 } as React.CSSProperties}>
        My thoughts on software development, life, and more.
      </p>

      <ol className="mt-14 border-b border-line md:mt-20">
        {posts.map((post, i) => (
          <li key={post.slug} className="border-t border-line" data-intro style={{ "--d": 3 + i } as React.CSSProperties}>
            <Link href={`/blog/${post.slug}`} className="group grid grid-cols-12 items-baseline gap-x-6 gap-y-2 py-7 md:py-9">
              <time dateTime={post.metadata.publishedAt} className="label col-span-12 text-ink-2 md:col-span-3">
                {formatDate(post.metadata.publishedAt)}
              </time>
              <span className="col-span-12 md:col-span-8">
                <span className="headline block text-title transition-transform duration-(--dur-base) ease-(--ease-out) group-hover:translate-x-2">
                  {post.metadata.title}
                </span>
                <span className="mt-2 block text-ink-2">{post.metadata.summary}</span>
              </span>
              <ArrowRight
                width={22}
                height={22}
                className="col-span-1 hidden justify-self-end text-ink-2 transition-transform duration-(--dur-base) ease-(--ease-out) group-hover:translate-x-1 group-hover:text-accent md:block"
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
