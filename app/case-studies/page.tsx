// app/case-studies/page.tsx
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

export const metadata = {
  title: "Case Studies | RH Consulting",
  description: "Real results from AI agents and automation delivered by RH Consulting.",
};

type CaseMeta = {
  title: string;
  slug: string;
  blurb?: string;
};

function readCaseStudies(dir: string): CaseMeta[] {
  try {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".mdx") || f.endsWith(".md"));
    return files.map((file) => {
      const slug = file.replace(/\.mdx?$/, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const titleMatch = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      const blurbMatch = raw.match(/^blurb:\s*["']?(.+?)["']?\s*$/m);
      return {
        title: titleMatch?.[1] ?? slug.replace(/-/g, " "),
        slug,
        blurb: blurbMatch?.[1],
      };
    });
  } catch {
    return [];
  }
}

export default function CaseStudiesPage() {
  const contentDir = path.join(process.cwd(), "content", "case-studies");
  const items = readCaseStudies(contentDir);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Case Studies</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          A sampling of outcomes from RH Consulting’s AI agents & automation work.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          No case studies published yet. We’re preparing fresh write-ups—check back soon.
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {items.map((c) => (
            <li key={c.slug} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-950">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                <Link href={`/case-studies/${c.slug}`} className="hover:underline">
                  {c.title}
                </Link>
              </h2>
              {c.blurb && (
                <p className="mt-2 text-slate-600 dark:text-slate-300">{c.blurb}</p>
              )}
              <div className="mt-4">
                <Link
                  href={`/case-studies/${c.slug}`}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                >
                  Read case study
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
