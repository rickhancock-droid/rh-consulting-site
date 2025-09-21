import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { renderMDX } from "@/lib/mdx";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export async function generateStaticParams() {
  const files = fs.existsSync(BLOG_DIR) ? fs.readdirSync(BLOG_DIR).filter(f => f.endsWith(".mdx")) : [];
  return files.map(file => ({ slug: file.replace(/\.mdx$/, "") }));
}

export async function generateMetadata({ params }:{ params:{slug:string} }) {
  const file = path.join(BLOG_DIR, `${params.slug}.mdx`);
  if (!fs.existsSync(file)) return {};
  const src = fs.readFileSync(file, "utf8");
  const { frontmatter } = await renderMDX(src);
  return {
    title: frontmatter.title ?? params.slug,
    description: frontmatter.description,
  };
}

export default async function BlogPost({ params }:{ params:{slug:string} }) {
  const file = path.join(BLOG_DIR, `${params.slug}.mdx`);
  if (!fs.existsSync(file)) notFound();
  const src = fs.readFileSync(file, "utf8");
  const { content, frontmatter } = await renderMDX(src);
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 prose prose-slate dark:prose-invert">
      <h1>{frontmatter.title}</h1>
      {content}
    </article>
  );
}

