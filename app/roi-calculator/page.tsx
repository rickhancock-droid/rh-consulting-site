"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ---------------------------------- CONFIG ---------------------------------- */
// Env-friendly config with safe defaults
const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ||
  "https://calendly.com/rick-hancock-rhconsulting/30min";
const LOGO_PATH =
  process.env.NEXT_PUBLIC_LOGO_PATH || "/Original on transparent.png";

// Template suggestions for quick add
const WORKFLOW_SUGGESTIONS = [
  "FAQ / info requests",
  "Lead qualification",
  "Customer support triage",
  "Content drafting",
  "Data entry / enrichment",
  "Weekly reporting",
];

// Case studies (default PDF = #1)
const CASE_STUDIES = [
  {
    id: 1,
    title: "Case Study 1 — AI Agentic Ops for Content & Support",
    client: "Mid-market SaaS (≈120 FTE)",
    problem:
      "High-volume repetitive content ops and support requests slowed teams; time lost in routing, drafting, and responses.",
    solution:
      "Agentic workflow: intake triage, retrieval-augmented drafting, human-in-the-loop approvals, and Slack/CRM updates.",
    outcome:
      "↑58% organic traffic in 90 days, ↑31% lead form conversions, ~45% faster content cycle; support first-response < 2m.",
    why:
      "Agentic chains compound: content, ops, and support workflows feed each other to amplify ROI and reduce cycle time.",
  },
  {
    id: 2,
    title: "Case Study 2 — Data Refinery for GTM",
    client: "B2B Services (≈80 FTE)",
    problem:
      "Messy prospect data and manual enrichment slowed pipeline creation; SDRs reworked the same records repeatedly.",
    solution:
      "Automated enrichment/refinery pipeline with dedupe, firmographic/technographic signals, and priority scoring.",
    outcome:
      "↑22% meeting conversion, ~35% fewer SDR touches per meeting, cleaner CRM with automated hygiene.",
    why:
      "Clean, enriched data compounds sales motion efficiency and improves downstream automation accuracy.",
  },
  {
    id: 3,
    title: "Case Study 3 — Agentic Support + Knowledge",
    client: "E-commerce (≈200 FTE)",
    problem:
      "Seasonal spikes overwhelmed support; answers were inconsistent across channels; knowledge became stale.",
    solution:
      "AI agents deflect FAQs with live knowledge sync, human fallback, and auto-learning from resolved tickets.",
    outcome:
      "30–45% deflection on FAQs, CSAT ↑12 pts, median handle time ↓28%; managers regained focus on coaching.",
    why:
      "Keeping knowledge fresh + reliable routing delivers durable ROI without eroding customer experience.",
  },
];

// A short glossary to embed into PDF (appendix)
const PDF_GLOSSARY: { term: string; def: string }[] = [
  { term: "Adoption", def: "Share of eligible work handled by AI agents (0–100%)." },
  { term: "Automation %", def: "Portion of a workflow’s steps that can be automated." },
  { term: "Agentic Automation", def: "Multi-step, goal-directed agents that plan, act, and verify." },
  { term: "RAG", def: "Retrieval-Augmented Generation: grounding outputs in your data." },
  { term: "Digital Labor", def: "Delegating repeatable, structured tasks to AI agents." },
];

/* ----------------------------------- TYPES ---------------------------------- */
type Workflow = {
  id: string;
  name: string;
  minPerTask: number;     // minutes
  tasksPerMonth: number;
  people: number;
  automationPct: number;  // 0–100
  hourly: number;         // $/hr
};

type Mode = "conservative" | "typical" | "optimal";

/* --------------------------------- HELPERS ---------------------------------- */
const fmtMoney = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
const fmtInt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const fteFromHours = (hours: number) => hours / 2080;
const uid = () => Math.random().toString(36).slice(2, 8);
const sanitizeInput = (s: string) => s.replace(/[&<>"']/g, "");

/* ------------------------------ MODE PRESETS -------------------------------- */
const MODES: Record<Mode, { label: string; adoptionPct: number }> = {
  conservative: { label: "Conservative", adoptionPct: 60 },
  typical: { label: "Typical", adoptionPct: 70 },
  optimal: { label: "Optimal", adoptionPct: 85 },
};

/* -------------------------------- COMPONENT --------------------------------- */
export default function RoiCalculatorPage() {
  // Single source of truth: mode + adoption
  const [mode, setMode] = useState<Mode>("typical");
  const [adoption, setAdoption] = useState<number>(MODES.typical.adoptionPct);

  useEffect(() => {
    setAdoption(MODES[mode].adoptionPct);
  }, [mode]);

  // Program-level inputs (baseline: 100 employees; CA SMB vibes)
  const [employees, setEmployees] = useState<number>(100);
  const [platformMonthly, setPlatformMonthly] = useState<number>(500);
  const [aiUsageMonthly, setAiUsageMonthly] = useState<number>(300);
  const [implOneTime, setImplOneTime] = useState<number>(3000);
  const [amortMonths, setAmortMonths] = useState<number>(12);

  // Workflows (with 2 common defaults)
  const [rows, setRows] = useState<Workflow[]>([
    {
      id: uid(),
      name: "FAQ / info requests",
      minPerTask: 3,
      tasksPerMonth: 800,
      people: 2,
      automationPct: 60,
      hourly: 45,
    },
    {
      id: uid(),
      name: "Lead qualification",
      minPerTask: 6,
      tasksPerMonth: 400,
      people: 2,
      automationPct: 55,
      hourly: 45,
    },
  ]);

  // “Add from templates” search
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");

  const filteredTemplates = WORKFLOW_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(templateQuery.toLowerCase())
  );

  // Derived metrics
  const { annualHours, annualLaborSavings, annualCosts, netBenefit, roiPct, wfHours } = useMemo(() => {
    const wfHours = rows.map((r) => {
      const hrs =
        (r.minPerTask / 60) *
        r.tasksPerMonth *
        12 *
        (r.automationPct / 100) *
        (adoption / 100);
      return { ...r, hours: hrs, dollars: hrs * r.hourly };
    });

    const annualHours = wfHours.reduce((a, b) => a + b.hours, 0);
    const annualLaborSavings = wfHours.reduce((a, b) => a + b.dollars, 0);

    const annualizedImpl = implOneTime / Math.max(1, amortMonths);
    const annualCosts = platformMonthly * 12 + aiUsageMonthly * 12 + annualizedImpl;

    const netBenefit = annualLaborSavings - annualCosts;
    const roiPct = annualCosts > 0 ? (netBenefit / annualCosts) * 100 : 0;

    return { annualHours, annualLaborSavings, annualCosts, netBenefit, roiPct, wfHours };
  }, [rows, adoption, platformMonthly, aiUsageMonthly, implOneTime, amortMonths]);

  // Actions
  const addRow = (name = "") =>
    setRows((prev) => [
      ...prev,
      {
        id: uid(),
        name: sanitizeInput(name),
        minPerTask: 5,
        tasksPerMonth: 500,
        people: 1,
        automationPct: 50,
        hourly: 45,
      },
    ]);

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id: string, patch: Partial<Workflow>) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              ...(patch.name ? { name: sanitizeInput(patch.name) } : {}),
              ...(patch.minPerTask !== undefined
                ? { minPerTask: clamp(patch.minPerTask, 0, 1000) }
                : {}),
              ...(patch.tasksPerMonth !== undefined
                ? { tasksPerMonth: clamp(patch.tasksPerMonth, 0, 100000) }
                : {}),
              ...(patch.people !== undefined ? { people: clamp(patch.people, 0, 1000) } : {}),
              ...(patch.automationPct !== undefined
                ? { automationPct: clamp(patch.automationPct, 0, 100) }
                : {}),
              ...(patch.hourly !== undefined ? { hourly: clamp(patch.hourly, 0, 1000) } : {}),
            }
          : r
      )
    );

  /* ------------------------------- PDF SUPPORT ------------------------------- */
  const pageRef = useRef<HTMLDivElement>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function wrapText(
    pdf: jsPDF,
    text: string,
    x: number,
    maxWidth: number,
    y: number,
    lineHeight = 16
  ) {
    if (!text) return y;
    const lines = pdf.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      pdf.text(line, x, y);
      y += lineHeight;
    }
    return y;
  }

  async function downloadPdf() {
    if (!pageRef.current) {
      setPdfError("Page content not found. Try again.");
      return;
    }

    try {
      // Theme-aware background so light mode doesn’t render dark
      const isDark = document.documentElement.classList.contains("dark");
      const canvas = await html2canvas(pageRef.current, {
        backgroundColor: isDark ? "#0b1220" : "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 40;

      // Logo (optional)
      try {
        const resp = await fetch(LOGO_PATH, { mode: "cors" });
        if (resp.ok) {
          const blob = await resp.blob();
          const reader = new FileReader();
          const dataUrl: string = await new Promise((res) => {
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(blob);
          });
          pdf.addImage(dataUrl, "PNG", 40, y, 120, 40);
        }
      } catch {
        /* ignore logo errors */
      }

      // Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("AI Agent ROI Calculator (Digital Labor) — ROI Results", 40, y + 60);

      // Key results line
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const line1 =
        `Annual Hours Saved: ${fmtInt(annualHours)}  |  ` +
        `Annual Labor Savings: ${fmtMoney(annualLaborSavings)}  |  ` +
        `Total Annual Costs: ${fmtMoney(annualCosts)}  |  ` +
        `Net Benefit: ${fmtMoney(netBenefit)}  |  ROI: ${fmtInt(roiPct)}%`;
      y = wrapText(pdf, line1, 40, pageW - 80, y + 80, 16);

      // Calculation Summary (approved copy)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("Calculation Summary", 40, (y += 24));
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const calcSummary =
        "Benefit: We estimate a portion of repetitive work shifts from humans to AI agents, with adoption ramping over time. " +
        "Hours saved are based on: employees × minutes per task × tasks per month × automation % × adoption % × 12 months. " +
        "This reflects productivity gains from reduced manual effort and faster completion.\n\n" +
        "Program Cost: Includes monthly platform costs, AI usage fees, and a one-time implementation cost, amortized across the selected number of months.\n\n" +
        "Net Impact: Net benefit equals annual labor savings minus total annual costs. ROI % is net benefit ÷ total annual costs.";
      y = wrapText(pdf, calcSummary, 40, pageW - 80, y + 10, 16);

      // Full calculator snapshot
      const imgW = pageW - 80;
      const imgH = (canvas.height * imgW) / canvas.width;
      if (y + imgH > pageH - 80) {
        pdf.addPage();
        y = 40;
      }
      pdf.addImage(imgData, "PNG", 40, (y += 20), imgW, imgH);
      y += imgH;

      // New page: Case Study + Glossary + Disclaimer
      pdf.addPage();
      y = 40;

      // Case Study 1 (default)
      const cs = CASE_STUDIES[0];
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(cs.title, 40, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      y = wrapText(pdf, `Client: ${cs.client}`, 40, pageW - 80, (y += 18));
      y = wrapText(pdf, `Problem: ${cs.problem}`, 40, pageW - 80, (y += 14));
      y = wrapText(pdf, `Solution: ${cs.solution}`, 40, pageW - 80, (y += 14));
      y = wrapText(pdf, `Outcome: ${cs.outcome}`, 40, pageW - 80, (y += 14));
      y = wrapText(pdf, `Why it matters: ${cs.why}`, 40, pageW - 80, (y += 14));

      // Glossary (selected)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("Appendix — Glossary (selected terms)", 40, (y += 28));
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      for (const g of PDF_GLOSSARY) {
        y = wrapText(pdf, `• ${g.term}: ${g.def}`, 40, pageW - 80, (y += 16));
        if (y > pageH - 80) {
          pdf.addPage();
          y = 40;
        }
      }

      // Disclaimer (short form)
      const disclaimer =
        "Disclaimer: The results of this calculator are provided for illustrative purposes only to help you explore potential benefits of AI automation in your organization. " +
        "Actual outcomes will vary and are not a guarantee or commitment of financial return. Results depend on factors including but not limited to implementation practices, " +
        "user adoption, workflow design and configurations, organizational processes, market conditions, and external economic factors. All calculations are presented in US dollars unless otherwise noted.";
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Disclaimer", 40, (y += 28));
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      wrapText(pdf, disclaimer, 40, pageW - 80, (y += 12), 16);

      pdf.save("ROI Results.pdf");
      setPdfError(null);
    } catch (e) {
      console.error(e);
      setPdfError("Failed to generate PDF. Please try again.");
    }
  }

  /* ----------------------------------- UI ------------------------------------ */
  return (
    <main ref={pageRef} className="mx-auto max-w-6xl px-4 py-8">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            AI Agent ROI Calculator <span className="text-orange-500">(Digital Labor)</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Defaults reflect a ~100-employee SMB — tweak for your org.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            href={CALENDLY_URL}
            target="_blank"
          >
            Book a Call with These Results
          </Link>
          <button
            onClick={downloadPdf}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            aria-label="Download ROI Results PDF"
          >
            ROI Results PDF
          </button>
        </div>
      </div>
      {pdfError && <p className="mt-2 text-sm text-red-500">{pdfError}</p>}

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashCard label="Annual Hours Saved" value={`${fmtInt(annualHours)} hrs`} />
        <DashCard label="Annual Labor Savings" value={fmtMoney(annualLaborSavings)} />
        <DashCard label="Total Annual Costs" value={fmtMoney(annualCosts)} />
        <DashCard label="Net Benefit & ROI" value={`${fmtMoney(netBenefit)}  •  ${fmtInt(roiPct)}%`} accent />
      </div>

      {/* Assumptions + Adoption */}
      <section className="mt-8 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-3">
          <ModePill label={MODES.conservative.label} active={mode === "conservative"} onClick={() => setMode("conservative")} />
          <ModePill label={MODES.typical.label} active={mode === "typical"} onClick={() => setMode("typical")} />
          <ModePill label={MODES.optimal.label} active={mode === "optimal"} onClick={() => setMode("optimal")} />
          <div className="ml-auto flex items-center gap-3">
            <input
              type="range"
              aria-label="Adoption (% of eligible work)"
              min={0}
              max={100}
              step={5}
              value={adoption}
              onChange={(e) => setAdoption(parseInt(e.target.value, 10))}
              className="w-44 md:w-56 accent-emerald-500"
            />
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Adoption: <span className="font-semibold">{adoption}%</span>
            </div>
          </div>
        </div>

        {/* 5-input row (single line on wide screens) */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumField label="Employees" value={employees} onChange={setEmployees} min={1} />
          <NumField label="Platform Cost (monthly)" value={platformMonthly} onChange={setPlatformMonthly} min={0} prefix="$" />
          <NumField label="AI Usage (monthly)" value={aiUsageMonthly} onChange={setAiUsageMonthly} min={0} prefix="$" />
          <NumField label="Implementation (one-time)" value={implOneTime} onChange={setImplOneTime} min={0} prefix="$" />
        </div>
      </section>

      {/* Workflows table + Add from templates */}
      <section className="mt-8 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <input
              value={templateQuery}
              onChange={(e) => setTemplateQuery(e.target.value)}
              onFocus={() => setTemplateOpen(true)}
              placeholder="+ Add from templates..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {templateOpen && filteredTemplates.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {filteredTemplates.map((t) => (
                  <button
                    key={t}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      addRow(t);
                      setTemplateQuery("");
                      setTemplateOpen(false);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => addRow("")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            + Add custom row
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="border-b border-slate-200 p-2 dark:border-slate-700">Workflow</th>
                <th className="border-b border-slate-200 p-2 dark:border-slate-700">Min/Task</th>
                <th className="border-b border-slate-200 p-2 dark:border-slate-700">Tasks/Month</th>
                <th className="border-b border-slate-200 p-2 dark:border-slate-700">People</th>
                <th className="border-b border-slate-200 p-2 dark:border-slate-700">Automation %</th>
                <th className="border-b border-slate-200 p-2 dark:border-slate-700">Hourly ($)</th>
                <th className="border-b border-slate-200 p-2 dark:border-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="text-sm">
                  <td className="border-b border-slate-200 p-2 dark:border-slate-700">
                    <TextField
                      label=""
                      value={r.name}
                      onChange={(v) => updateRow(r.id, { name: v })}
                    />
                  </td>
                  <td className="border-b border-slate-200 p-2 dark:border-slate-700">
                    <NumField label="" value={r.minPerTask} onChange={(v) => updateRow(r.id, { minPerTask: v })} min={0} />
                  </td>
                  <td className="border-b border-slate-200 p-2 dark:border-slate-700">
                    <NumField label="" value={r.tasksPerMonth} onChange={(v) => updateRow(r.id, { tasksPerMonth: v })} min={0} />
                  </td>
                  <td className="border-b border-slate-200 p-2 dark:border-slate-700">
                    <NumField label="" value={r.people} onChange={(v) => updateRow(r.id, { people: v })} min={0} />
                  </td>
                  <td className="border-b border-slate-200 p-2 dark:border-slate-700">
                    <NumField label="" value={r.automationPct} onChange={(v) => updateRow(r.id, { automationPct: v })} min={0} max={100} />
                  </td>
                  <td className="border-b border-slate-200 p-2 dark:border-slate-700">
                    <NumField label="" value={r.hourly} onChange={(v) => updateRow(r.id, { hourly: v })} min={0} />
                  </td>
                  <td className="border-b border-slate-200 p-2 text-right dark:border-slate-700">
                    <button
                      onClick={() => removeRow(r.id)}
                      className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Calculation Summary (same copy as PDF, visible on page for transparency) */}
      <section className="mt-8 rounded-xl border border-slate-200 p-4 text-sm leading-relaxed dark:border-slate-700 dark:text-slate-200">
        <h2 className="mb-2 text-base font-semibold">Calculation Summary</h2>
        <p>
          <strong>Benefit:</strong> We estimate a portion of repetitive work shifts from humans to AI agents, with adoption
          ramping over time. Hours saved are based on: employees × minutes per task × tasks per month × automation % ×
          adoption % × 12 months. This reflects productivity gains from reduced manual effort and faster completion.
        </p>
        <p className="mt-2">
          <strong>Program Cost:</strong> Includes monthly platform costs, AI usage fees, and a one-time implementation cost,
          amortized across the selected number of months.
        </p>
        <p className="mt-2">
          <strong>Net Impact:</strong> Net benefit equals annual labor savings minus total annual costs. ROI % is net benefit ÷
          total annual costs.
        </p>
      </section>

      {/* Short Disclaimer */}
      <section className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        The results of this calculator are provided for illustrative purposes only to help you explore potential benefits of AI
        automation in your organization. Actual outcomes will vary and are not a guarantee or commitment of financial return.
        Results depend on factors including but not limited to implementation practices, user adoption, workflow design and
        configurations, organizational processes, market conditions, and external economic factors. All calculations are presented
        in US dollars unless otherwise noted.
      </section>
    </main>
  );
}

/* ---------------------------- SMALL UI SUBCOMPONENTS ---------------------------- */

type DashCardProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function DashCard({ label, value, accent }: DashCardProps) {
  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (accent
          ? "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-200"
          : "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100")
      }
    >
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function ModePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-sm " +
        (active
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700")
      }
    >
      {label}
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={"block " + className}>
      {label ? (
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      ) : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
      />
    </label>
  );
}

type NumFieldProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
  className?: string;
};

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  prefix,
  className = "",
}: NumFieldProps) {
  return (
    <label className={"block " + className}>
      {label ? (
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      ) : null}
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
            {prefix}
          </span>
        ) : null}
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={Number.isFinite(value) ? String(value) : ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            const n = raw === "" ? 0 : parseInt(raw, 10);
            const clamped = clamp(n, min ?? Number.MIN_SAFE_INTEGER, max ?? Number.MAX_SAFE_INTEGER);
            onChange(clamped);
          }}
          className={
            "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" +
            (prefix ? " pl-7" : "")
          }
        />
      </div>
    </label>
  );
}

