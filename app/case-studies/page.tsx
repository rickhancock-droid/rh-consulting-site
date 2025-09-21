// app/case-studies/page.tsx
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

type Frontmatter = {
  title: string;
  slug: string;
  summary?: string;
  industry?: string;
};

export const metadata = {
  title: "Case Studies | RH Consulting",
  description: "Real results from visibility, data refinery, and agentic AI projects.",
};

function getCases(): Frontmatter[] {
  const dir = path.join(process.cwd(), "content/case-studies");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const file = fs.readFileSync(path.join(dir, f), "utf8");
      const fm = /---([\s\S]*?)---/.exec(file)?.[1] ?? "";
      const pick = (key: string) => new RegExp(`${key}:[^\\n]*`).exec(fm)?.[0].split(":")[1].trim().replace(/^"|"$/g, "");
      return {
        title: pick("title") ?? f.replace(".mdx", ""),
        slug: pick("slug") ?? f.replace(".mdx", ""),
        summary: pick("summary") ?? "",
        industry: pick("industry") ?? "",
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default function CaseStudiesIndex() {
  const cases = getCases();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Case Studies</h1>
      <p className="text-slate-400 mb-8">Browse real outcomes across SMB and enterprise programs.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {cases.map((c) => (
          <Link
            key={c.slug}
            href={`/case-studies/${c.slug}`}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:bg-slate-900/70 transition"
          >
            <div className="text-lg font-medium">{c.title}</div>
            {c.industry && <div className="text-xs text-slate-400 mt-1">{c.industry}</div>}
            {c.summary && <p className="text-sm text-slate-300 mt-3">{c.summary}</p>}
          </Link>
        ))}
      </div>
    </main>
  );
}

