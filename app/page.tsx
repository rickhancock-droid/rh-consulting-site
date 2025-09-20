import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-brand-ink">
              AI strategy that pays for itself
            </h1>
            <p className="mt-4 text-brand-muted">
              Estimate hours saved, labor savings, ROI and payback with our AI ROI Calculator—then book a call with your results pre-filled.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/roi-calculator" className="inline-flex items-center px-5 py-3 rounded-2xl bg-brand-primary hover:bg-brand-primaryDark text-white shadow-sm">
                Open the AI ROI Calculator
              </Link>
              <a href="#contact" className="inline-flex items-center px-5 py-3 rounded-2xl bg-brand-accent hover:bg-brand-accentDark text-white shadow-sm">
                Contact
              </a>
            </div>
          </div>
          <div className="hidden md:block">
            <img src="/hero.jpg" alt="RH Consulting — AI Automation" className="w-full rounded-2xl shadow-card" />
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-2xl border bg-white p-6 shadow-card">
          <h2 className="text-xl font-semibold text-brand-ink">Contact</h2>
          <p className="mt-2 text-brand-muted">
            Email <a className="text-brand-primary underline" href="mailto:hello@rhconsulting.ai">hello@rhconsulting.ai</a>
          </p>
        </div>
      </section>
    </>
  );
}

