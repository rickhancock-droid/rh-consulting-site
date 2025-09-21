import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Link from "next/link";

export const metadata = { title: "Blog | RH Consulting" };

type PostMeta = {
  title: string;
  description: string;
  date: string; // ISO
  tags?: string[];
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export default async function BlogIndex() {
  if (!fs.existsSync(BLOG_DIR)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h1 className="text-3xl font-semibold heading mb-6">Insights & Playbooks</h1>
        <p className="muted">No posts yet. First article coming soon.</p>
      </div>
    );
  }

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  const posts = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data } = matter(raw);
      const fm = data as PostMeta;
      return { slug, ...fm };
    })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-semibold heading mb-6">Insights & Playbooks</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <article key={p.slug} className="card p-6">
            <h2 className="font-semibold heading mb-1">
              <Link href={`/blog/${p.slug}`}>{p.title}</Link>
            </h2>
            <p className="muted">{p.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

