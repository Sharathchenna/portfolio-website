import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export type PostMeta = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function markdownToHTML(markdown: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      // Both themes are emitted as CSS variables; globals.css picks one from the .dark class.
      theme: { light: "github-light", dark: "github-dark-dimmed" },
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}

export function getSlugs() {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => path.extname(f) === ".mdx")
    .map((f) => path.basename(f, ".mdx"));
}

export async function getPost(slug: string) {
  const file = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const { content, data } = matter(fs.readFileSync(file, "utf-8"));
  return { slug, metadata: data as PostMeta, source: await markdownToHTML(content) };
}

export async function getBlogPosts() {
  const posts = await Promise.all(getSlugs().map(getPost));
  return posts
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => (a.metadata.publishedAt < b.metadata.publishedAt ? 1 : -1));
}
