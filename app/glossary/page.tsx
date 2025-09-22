// app/glossary/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";

const CALENDLY = "https://calendly.com/rick-hancock-rhconsulting/30min";

type Term = {
  id: string;
  term: string;
  short: string;
  long?: string;
  aka?: string[];
};

const TERMS: Term[] = [
  {
    id: "agentic-ai",
    term: "Agentic AI",
    short:
      "AI systems that autonomously plan and execute actions to achieve business goals, reducing the need for constant human oversight.",
    long:
      "Agentic AI combines planning, tool use, memory, and feedback loops so software can move beyond static prompts. In business, this looks like agents that triage requests, draft replies, update systems of record, and escalate exceptions—reliably and safely.",
    aka: ["autonomous ai", "ai agents"],
  },
  {
    id: "ai-agent",
    term: "AI Agent",
    short:
      "Software that acts on behalf of a person or system—perceiving context, reasoning about next steps, and completing tasks.",
    long:
      "Unlike simple scripts or chatbots, agents can chain steps, call APIs, consult knowledge bases, and coordinate with other agents or humans to reach an outcome.",
    aka: ["autonomous agent", "llm agent"],
  },
  {
    id: "digital-worker",
    term: "Digital Worker",
    short:
      "An AI-powered ‘virtual employee’ that handles repetitive, rules-based tasks at scale (e.g., routing emails, updating CRM, drafting responses).",
    long:
      "Digital workers operate within guardrails and leave an audit trail. They’re ideal for high-volume processes with clear inputs/outputs, freeing humans for judgment and relationship work.",
    aka: ["virtual employee", "ai employee"],
  },
  {
    id: "rag",
    term: "RAG (Retrieval-Augmented Generation)",
    short:
      "A method that blends a generative model with live data retrieval to produce accurate, source-grounded answers.",
    long:
      "RAG fetches relevant docs from your knowledge store, then passes them to the model as context, reducing hallucinations and keeping responses up to date.",
    aka: ["retrieval augmented generation"],
  },
  {
    id: "agentic-architecture",
    term: "Agentic Architecture",
    short:
      "A design pattern where multiple specialized agents coordinate inside a workflow to achieve outcomes (planner, executor, reviewer, router, etc.).",
  },
  {
    id: "ai-agent-frameworks",
    term: "AI Agent Frameworks",
    short:
      "Toolkits and platforms for building, orchestrating, and monitoring agents in production (e.g., routing, memory, tools, evals, observability).",
  },
  {
    id: "llm-agents",
    term: "LLM Agents",
    short:
      "Agents powered by large language models (LLMs) that can reason over text, call tools/APIs, and generate structured outputs.",
  },
  {
    id: "digital-labor",
    term: "Digital Labor",
    short:
      "Measurable work completed by AI systems; often quantified in hours saved, cost per task, or service-level improvements.",
  },
  {
    id: "ai-vs-chatbot",
    term: "AI Agents vs. Chatbots",
    short:
      "Chatbots answer prompts; agents pursue outcomes—planning steps, calling tools, and updating systems to complete tasks.",
  },
  {
    id: "agentic-workflows",
    term: "Agentic Workflows",
    short:
      "Business processes redesigned so agents handle repeated steps, with humans focused on exceptions, approvals, or relationship work.",
  },
  {
    id: "knowledge-grounding",
    term: "Knowledge Grounding",
    short:
      "Supplying trusted, business-specific context (policies, SOPs, SKUs) so agents produce accurate, on-brand results.",
  },
  {
    id: "tool-use",
    term: "Tool Use (Function Calling)",
    short:
      "An agent’s capability to call external tools/APIs (e.g., CRM update, DB query, email send) as part of a step-by-step plan.",
    aka: ["function calling", "tools"],
  },
  {
    id: "observability",
    term: "Observability & Evals",
    short:
      "Telemetry, traces, and evaluations that measure agent quality (accuracy, safety, latency, cost) and prevent regressions.",
  },
  {
    id: "safety-guardrails",
    term: "Safety & Guardrails",
    short:
      "Controls that constrain agent behavior: policy checks, allow/deny lists, PII handling, rate limits, and human-in-the-loop steps.",
  },
  {
    id: "human-in-the-loop",
    term: "Human-in-the-Loop (HITL)",
    short:
      "Pattern where humans review/approve critical steps or exceptions before agents proceed—key for compliance and trust.",
    aka: ["HITL"],
  },
  {
    id: "adoption-rate",
    term: "Adoption Rate",
    short:
      "The share of eligible work that actually runs through agents. Higher adoption compounds ROI by standardizing usage.",
  },
  {
    id: "automation-rate",
    term: "Automation Rate",
    short:
      "Percent of a workflow that can be automated by agents today. Improves over time as prompts, tools, and data quality improve.",
  },
];

const sortAlpha = (a: Term, b: Term) =>
  a.term.localeCompare(b.term, undefined, { sensitivity: "base" });

export default function GlossaryPage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return TERMS.slice().sort(sortAlpha);
    return TERMS.filter((t) => {
      const hay =
        `${t.term} ${t.short} ${t.long ?? ""} ${(t.aka ?? []).join(" ")}`.toLowerCase();
      return hay.includes(needle);
    }).sort(sortAlpha);
  }, [q]);

  const jsonLd = useMemo(() => {
    const items = TERMS.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.short,
      url: `https://your-domain.com/glossary#${t.id}`,
    }));
    return {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: "RH Consulting AI & Automation Glossary",
      description:
        "Plain-English definitions of AI agents, agentic architecture, digital workers, RAG, and related automation terms.",
      url: "https://your-domain.com/glossary",
      hasDefinedTerm: items,
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        AI & Automation Glossary
      </h1>
      <p className="mt-3 text-muted-foreground">
        Plain-English definitions used across RH Consulting projects. Search or
        browse A–Z. Hover terms in the ROI Calculator to see quick tooltips.
      </p>

      <div className="mt-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terms…"
          className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
          aria-label="Search glossary"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((ch) => (
          <a
            key={ch}
            href={`#letter-${ch}`}
            className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {ch}
          </a>
        ))}
      </div>

      <div className="mt-8 space-y-8">
        {groupByFirstLetter(filtered).map(([letter, terms]) => (
          <section key={letter} id={`letter-${letter}`}>
            <h2 className="mb-4 text-xl font-semibold text-muted-foreground">
              {letter}
            </h2>
            <ul className="space-y-6">
              {terms.map((t) => (
                <li key={t.id} id={t.id} className="scroll-mt-24">
                  <h3 className="text-lg font-semibold">
                    {t.term}{" "}
                    {t.aka?.length ? (
                      <span className="ml-2 text-sm text-muted-foreground">
                        (also: {t.aka.join(", ")})
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-1 leading-relaxed">{t.short}</p>
                  {t.long ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-violet-600 hover:underline">
                        Learn more
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t.long}
                      </p>
                    </details>
                  ) : null}
                  <div className="mt-3 text-sm">
                    <Link
                      href="/roi-calculator"
                      className="text-violet-600 hover:underline"
                    >
                      See how this impacts ROI →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border bg-muted/30 p-6">
        <h2 className="text-xl font-semibold">Have questions?</h2>
        <p className="mt-2 text-muted-foreground">
          Book a 30-minute consult and we’ll map these concepts to your
          workflows and ROI.
        </p>
        <a
          href={CALENDLY}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700"
        >
          Book a consultation
        </a>
      </div>

      <Script
        id="glossary-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}

// --- helpers ---
function groupByFirstLetter(terms: Term[]): [string, Term[]][] {
  const map = new Map<string, Term[]>();
  for (const t of terms) {
    const letter = (t.term[0] || "#").toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(t);
  }
  return Array.from(map.entries()).map(([k, v]) => [k, v.sort(sortAlpha)]);
}

