// app/page.tsx
export const metadata = {
  title: "RH Consulting | AI Agents & Automation",
  description:
    "AI agents, automation, and ROI-focused consulting for SMBs and growth teams. Book a call to see time and cost savings.",
};

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[70vh] bg-white dark:bg-slate-950">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              RH Consulting — AI Agents that drive ROI
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              We design, deploy, and tune AI agents to automate real work. Explore our ROI calculator,
              read case studies, or book a working session.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/roi-calculator"
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Try the ROI Calculator
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                Read the Blog
              </Link>
            </div>
          </div>

          <div className="mt-6 md:mt-0">
            <div className="rounded-2xl border border-slate-200 p-5 shadow-sm dark:border-slate-800">
              <div className="text-sm text-slate-500 dark:text-slate-400">Quick links</div>
              <ul className="mt-3 space-y-2 text-slate-700 dark:text-slate-200">
                <li>
                  <Link href="/services/automation" className="hover:underline">
                    Automation Services
                  </Link>
                </li>
                <li>
                  <Link href="/case-studies" className="hover:underline">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/accessibility" className="hover:underline">
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

