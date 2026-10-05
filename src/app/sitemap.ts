import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();
  return [
    { url: DATA.url, changeFrequency: "monthly", priority: 1 },
    { url: `${DATA.url}/resume`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${DATA.url}/blog`, changeFrequency: "monthly", priority: 0.6 },
    ...posts.map((p) => ({ url: `${DATA.url}/blog/${p.slug}`, lastModified: p.metadata.publishedAt, priority: 0.5 })),
  ];
}
