"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import SocialIcons from "@/components/SocialIcons";

export default function Home() {
  return (
    <main id="top" className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <header className="px-6 md:px-12 pt-12 pb-10 text-center bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Let AI Drive Your Business, Not Just Buzzwords
          </h1>
          <p className="mt-3 text-base md:text-xl text-gray-600">
            Build AI agents, automate workflows, and turn messy data into clear decisions — fast, strategic, and human-friendly.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-black text-white hover:bg-gray-800 transition"
            >
              Book a Free AI Audit
            </a>
            <a
              href="#use-cases"
              className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold border border-gray-300 hover:bg-white transition"
            >
              See AI Use Cases
            </a>
          </div>

          {/* Imagery strip */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <Image
                src="https://static.wixstatic.com/media/f276fb_29048df563ee480b9432efb13b609f93~mv2.png/v1/fill/w_1200,h_800,al_c,q_85,enc_avif,quality_auto/Screenshot%202025-09-16%20at%2010_38_14%E2%80%AFPM.png"
                alt="AI workflow dashboard"
                width={1200}
                height={800}
                className="h-48 w-full object-cover"
                priority
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <Image
                src="https://static.wixstatic.com/media/11062b_948396465145406fa2818addd3a7f5ba~mv2.jpg/v1/fill/w_1200,h_1600,al_c,q_85,enc_avif,quality_auto/11062b_948396465145406fa2818addd3a7f5ba~mv2.jpg"
                alt="Brand texture"
                width={1200}
                height={1600}
                className="h-48 w-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <Image
                src="https://static.wixstatic.com/media/11062b_7f665559e4bf436aa326e7f3ae23ee54~mv2.jpeg/v1/fill/w_1200,h_800,al_c,q_80,enc_avif,quality_auto/11062b_7f665559e4bf436aa326e7f3ae23ee54~mv2.jpeg"
                alt="Handshake (partnerships)"
                width={1200}
                height={800}
                className="h-48 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Services */}
      <section id="services" className="px-6 md:px-12 py-10 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold">What We Do</h2>
          <p className="mt-2 text-gray-600 max-w-2xl">
            From strategy to automation to data pipelines, we make AI useful — not just shiny.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { title: "AI Agents & Automation", desc: "Automate ops, sales, and support with agents that think and act across your stack." },
              { title: "Data Refinery Services", desc: "Clean, structure, and pipe data into dashboards and AI systems that make sense." },
              { title: "Strategic AI Consulting", desc: "Roadmaps, ROI models, and secure implementations aligned to business goals." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-gray-600">{s.desc}</p>
                <a href="#contact" className="mt-4 inline-block text-sm font-semibold text-black underline decoration-gray-300 hover:decoration-black">
                  Talk to an expert →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="px-6 md:px-12 py-10 scroll-mt-24 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold">Where It Delivers</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              { title: "Lead Scoring & Routing", desc: "Qualify leads with agentic workflows and route to the right team automatically." },
              { title: "Customer Support Co-Pilots", desc: "Deflect FAQs, draft replies, and escalate with context — faster resolutions." },
              { title: "Ops Reporting on Autopilot", desc: "Daily/weekly rollups from scattered systems, delivered to Slack/Email." },
              { title: "Knowledge Base Q&A", desc: "Private, secure RAG over your docs for instant, accurate answers." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-gray-200 p-6 bg-white">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-2 text-gray-600">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study CTA */}
      <section className="px-6 md:px-12 py-10 bg-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Real Businesses. Real Impact.</h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            From Fortune 100 to fast-growing startups — we ship automations and insights that save hours and create lift.
          </p>
          <a
            href="#contact"
            className="mt-6 inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-black text-white hover:bg-gray-800 transition"
          >
            Explore Case Studies
          </a>
        </div>
      </section>

      {/* Contact (with socials only here) */}
      <section id="contact" className="px-6 md:px-12 py-12 bg-gray-50 scroll-mt-24">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Book a Free AI Audit</h2>
          <p className="mt-2 text-gray-600">
            Tell us where it hurts; we’ll show quick wins and a path to production in weeks, not months.
          </p>
          <form
            className="mt-6 grid gap-3 text-left"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thanks! We’ll reach out shortly.");
            }}
          >
            <input
              type="text"
              placeholder="Your name"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <input
              type="email"
              placeholder="Work email"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <textarea
              placeholder="What would you like to automate or improve?"
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              className="rounded-2xl px-6 py-3 font-semibold bg-black text-white hover:bg-gray-800 transition"
            >
              Request Audit
            </button>
          </form>

          {/* Socials ONLY in contact */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Prefer social?</p>
            <div className="flex justify-center">
              <SocialIcons />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t text-sm text-gray-500 text-center">
        © {new Date().getFullYear()} RH Consulting. All rights reserved.
      </footer>
    </main>
  );
}

