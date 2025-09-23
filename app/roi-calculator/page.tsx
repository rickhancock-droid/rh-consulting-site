"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ----------------------------- CONFIG / CONSTANTS ----------------------------- */

const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ||
  "https://calendly.com/rick-hancock-rhconsulting/30min";

const LOGO_PATH =
  process.env.NEXT_PUBLIC_LOGO_PATH || "/Original on transparent.png";

type Mode = "conservative" | "typical" | "optimal";
const MODES: Record<Mode, { label: string; adoptionPct: number }> = {
  conservative: { label: "Conservative", adoptionPct: 60 },
  typical: { label: "Typical", adoptionPct: 70 },
  optimal: { label: "Optimal", adoptionPct: 85 },
};

// 6 menu templates
const WORKFLOW_SUGGESTIONS = [
  "Customer Experience Ops",
  "Automation Standardization",
  "Incident & Resiliency Ops",
  "Sales Enablement",
  "Data Entry & QA",
  "Knowledge Base Automation",
] as const;

type Workflow = {
  id: string;
  name: string;
  minPerTask: number; // minutes
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0–100
  hourly: number;
};

const CASE_STUDIES = [
  {
    id: 1,
    title: "Case Study 1 — CX Ops Automation",
    client: "Consumer SaaS (SMB ~120 employees)",
    problem:
      "High inbound volume across email and chat; repetitive requests slowed response and drove backlog.",
    solution:
      "Deployed AI agents for triage, FAQ answers, and ticket enrichment; standardized automations across support tools.",
    outcome:
      "58% organic traffic lift (90 days), 31% more lead form conversions, ~45% faster content-to-publish cycle; ~30–40% handle-time reduction in support queue.",
    why: "Compounds benefits across content, ops, and support—agentic automation multiplies ROI across workflows.",
  },
  {
    id: 2,
    title: "Case Study 2 — Automation Standardization",
    client: "B2B Services (mid-market)",
    problem:
      "Fragmented scripts and runbooks; inconsistent quality and rework increased labor cost.",
    solution:
      "Centralized automation library, templated tasks, and AI-assisted runbook execution.",
    outcome:
      "~35% cycle-time reduction; improved quality; fewer escalations; predictable throughput.",
    why: "Standardization increases reuse and adoption, boosting time-to-value.",
  },
  {
    id: 3,
    title: "Case Study 3 — Incident & Resiliency Ops",
    client: "Digital Retailer",
    problem:
      "Slow incident triage and coordination; high after-hours burden on on-call teams.",
    solution:
      "Automated incident classification, comms, and first-response tasks; AI postmortems.",
    outcome:
      "~25–40% MTTR reduction; better customer uptime; lower overtime and burnout.",
    why: "Resilient, automated response protects revenue and experience.",
  },
];

// Short glossary added to PDF appendix + full page link in header
const PDF_GLOSSARY = [
  { term: "ROI", def: "Return on Investment: (Net Benefit ÷ Total Costs) × 100." },
  {
    term: "Automation adoption",
    def: "Percent of eligible work actually performed by AI agents after rollout.",
  },
  {
    term: "Digital labor",
    def: "AI agents performing structured tasks that would otherwise require humans.",
  },
  {
    term: "Standardization",
    def: "Unifying workflows/templates so automations are easier to deploy & maintain.",
  },
];

/* --------------------------------- HELPERS ---------------------------------- */

const fmtMoney = (n: number, currency: string = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

const fmtInt = (n: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(n));

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const uid = () => Math.random().toString(36).slice(2, 8);

/* --------------------------------- PAGE ------------------------------------ */

export default function RoiCalculatorPage() {
  /* === Assumption mode + automation adoption === */
  const [mode, setMode] = useState<Mode>("typical");
  const [adoption, setAdoption] = useState<number>(MODES.typical.adoptionPct);
  useEffect(() => setAdoption(MODES[mode].adoptionPct), [mode]);

  /* === Program inputs (5 fields) === */
  const [employees, setEmployees] = useState<number>(100);
  const [platformMonthly, setPlatformMonthly] = useState<number>(500);
  const [aiUsageMonthly, setAiUsageMonthly] = useState<number>(300);
  const [implOneTime, setImplOneTime] = useState<number>(3000);
  const [amortMonths, setAmortMonths] = useState<number>(12);

  /* === Default rows (3) chosen for “Typical” ROI === */
  const [rows, setRows] = useState<Workflow[]>([
    {
      id: uid(),
      name: "Customer Experience Ops",
      minPerTask: 4, // mins
      tasksPerMonth: 1200,
      people: 3,
      automationPct: 60,
      hourly: 45,
    },
    {
      id: uid(),
      name: "Automation Standardization",
      minPerTask: 8,
      tasksPerMonth: 600,
      people: 2,
      automationPct: 55,
      hourly: 45,
    },
    {
      id: uid(),
      name: "Incident & Resiliency Ops",
      minPerTask: 10,
      tasksPerMonth: 300,
      people: 2,
      automationPct: 50,
      hourly: 45,
    },
  ]);

  /* === Template dropdown state (one-click close, ESC, outside click) === */
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setTemplateOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setTemplateOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const filteredTemplates = WORKFLOW_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(templateQuery.toLowerCase())
  );

  /* === Derived calculations === */
  const { annualHours, annualLaborSavings, annualCosts, netBenefit, roiPct } =
    useMemo(() => {
      const wfHours = rows.map((r) => {
        const hrs =
          (r.minPerTask / 60) *
          r.tasksPerMonth *
          12 *
          (r.automationPct / 100) *
          (adoption / 100);
        return { hours: hrs, dollars: hrs * r.hourly };
      });

      const annualHours = wfHours.reduce((a, b) => a + b.hours, 0);
      const annualLaborSavings = wfHours.reduce((a, b) => a + b.dollars, 0);

      const annualizedImpl = implOneTime / Math.max(1, amortMonths);
      const annualCosts =
        platformMonthly * 12 + aiUsageMonthly * 12 + annualizedImpl;

      const netBenefit = annualLaborSavings - annualCosts;
      const roiPct = annualCosts > 0 ? (netBenefit / annualCosts) * 100 : 0;

      return { annualHours, annualLaborSavings, annualCosts, netBenefit, roiPct };
    }, [rows, adoption, platformMonthly, aiUsageMonthly, implOneTime, amortMonths]);

  /* === PDF refs & generator === */
  const pageRef = useRef<HTMLDivElement>(null);

  async function handlePdf() {
    if (!pageRef.current) return;

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

    if (LOGO_PATH) {
      try {
        const logoResp = await fetch(LOGO_PATH, { mode: "cors" });
        if (logoResp.ok) {
          const blob = await logoResp.blob();
          const reader = new FileReader();
          const dataUrl: string = await new Promise((res) => {
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(blob);
          });
          pdf.addImage(dataUrl, "PNG", 40, y, 120, 40);
        }
      } catch {}
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("AI Agent ROI Calculator (Digital Labor) — ROI Results", 40, (y += 60));

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    const line1 =
      `Annual Hours Saved: ${fmtInt(annualHours)}  |  ` +
      `Annual Labor Savings: ${fmtMoney(annualLaborSavings)}  |  ` +
      `Total Annual Costs: ${fmtMoney(annualCosts)}  |  ` +
      `Net Benefit: ${fmtMoney(netBenefit)}  |  ROI: ${fmtInt(roiPct)}%`;
    y = wrapText(pdf, line1, 40, pageW - 80, (y += 16), 16);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Calculation Summary", 40, (y += 24));
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    const calcSummary =
      "Benefit: Portion of repetitive work shifts from humans to AI agents; adoption ramps over time. " +
      "Hours saved = employees × minutes/task × tasks/month × automation% × adoption% × 12 months.\n\n" +
      "Program Cost: Monthly platform + AI usage + implementation amortized.\n\n" +
      "Net Impact: Net benefit = annual labor savings − total annual costs; ROI% = net ÷ costs × 100.";
    y = wrapText(pdf, calcSummary, 40, pageW - 80, (y += 10), 16);

    const imgW = pageW - 80;
    const imgH = (canvas.height * imgW) / canvas.width;
    if (y + imgH > pageH - 80) {
      pdf.addPage();
      y = 40;
    }
    pdf.addImage(imgData, "PNG", 40, (y += 20), imgW, imgH);
    y += imgH;

    pdf.addPage();
    y = 40;
    const cs = CASE_STUDIES[0]; // default in PDF
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(cs.title, 40, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    y = wrapText(pdf, `Client: ${cs.client}`, 40, pageW - 80, (y += 18), 16);
    y = wrapText(pdf, `Problem: ${cs.problem}`, 40, pageW - 80, (y += 14), 16);
    y = wrapText(pdf, `Solution: ${cs.solution}`, 40, pageW - 80, (y += 14), 16);
    y = wrapText(pdf, `Outcome: ${cs.outcome}`, 40, pageW - 80, (y += 14), 16);
    y = wrapText(pdf, `Why it matters: ${cs.why}`, 40, pageW - 80, (y += 14), 16);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Appendix — Glossary", 40, (y += 28));
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    for (const g of PDF_GLOSSARY) {
      y = wrapText(pdf, `• ${g.term}: ${g.def}`, 40, pageW - 80, (y += 16), 16);
      if (y > pageH - 80) {
        pdf.addPage();
        y = 40;
      }
    }

    pdf.save("ROI Results.pdf");

    try {
      await fetch("/api/notify-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employees,
          adoption,
          annualHours: Math.round(annualHours),
          annualLaborSavings: Math.round(annualLaborSavings),
          annualCosts: Math.round(annualCosts),
          netBenefit: Math.round(netBenefit),
          roiPct,
          mode,
          pageUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
    } catch {}
  }

  /* === Build table columns WITHOUT stray whitespace (prevents hydration mismatch) === */
  // Optional future toggle to link people to adoption*employees; leave false to keep rows editable.
  const [linkPeople] = useState(false);

  const cols = useMemo(
    () =>
      linkPeople
        ? [
            <col key="name" className="w-[32%]" />,
            <col key="min" className="w-[9%]" />,
            <col key="perperson" className="w-[14%]" />,
            <col key="part" className="w-[12%]" />,
            <col key="eff" className="w-[12%]" />,
            <col key="auto" className="w-[12%]" />,
            <col key="hour" className="w-[10%]" />,
            <col key="act" className="w-[9%]" />,
          ]
        : [
            <col key="name" className="w-[32%]" />,
            <col key="min" className="w-[9%]" />,
            <col key="tasks" className="w-[16%]" />,
            <col key="people" className="w-[12%]" />,
            <col key="auto" className="w-[12%]" />,
            <col key="hour" className="w-[10%]" />,
            <col key="act" className="w-[9%]" />,
          ],
    [linkPeople]
  );

  /* ----------------------------------- UI ----------------------------------- */
  return (
    <main ref={pageRef} className="mx-auto max-w-6xl px-4 py-8">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            AI Agent ROI Calculator <span className="text-orange-500">(Digital Labor)</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Defaults reflect a ~100-employee SMB — tweak for your org.
          </p>
          <div className="mt-1 text-sm">
            <Link
              href="/glossary"
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Glossary
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            href={CALENDLY_URL}
            target="_blank"
          >
            Book a Call with These Results
          </Link>
          <button
            onClick={handlePdf}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Download ROI Results PDF"
          >
            ROI Results PDF
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashCard label="Annual Hours Saved" value={`${fmtInt(annualHours)} hrs`} />
        <DashCard label="Annual Labor Savings" value={fmtMoney(annualLaborSavings)} />
        <DashCard label="Total Annual Costs" value={fmtMoney(annualCosts)} />
        <DashCard
          label="Net Benefit & ROI"
          value={`${fmtMoney(netBenefit)}  •  ${fmtInt(roiPct)}%`}
          accent
        />
      </div>

      {/* Assumptions + Adoption */}
      <section className="mt-8 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-3">
          <ModePill
            label={MODES.conservative.label}
            active={mode === "conservative"}
            onClick={() => setMode("conservative")}
          />
          <ModePill
            label={MODES.typical.label}
            active={mode === "typical"}
            onClick={() => setMode("typical")}
          />
          <ModePill
            label={MODES.optimal.label}
            active={mode === "optimal"}
            onClick={() => setMode("optimal")}
          />
          <div className="ml-auto flex items-center gap-3">
            <label className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-medium">Automation adoption</span>:{" "}
              <span className="font-semibold">{adoption}%</span>
            </label>
            <input
              type="range"
              aria-label="Automation adoption (% of eligible work)"
              min={0}
              max={100}
              step={5}
              value={adoption}
              onChange={(e) => setAdoption(parseInt(e.target.value, 10))}
              className="w-44 md:w-56 accent-emerald-500"
            />
          </div>
        </div>

        {/* 5-input row */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <NumField label="Employees" value={employees} onChange={setEmployees} min={1} />
          <NumField label="Platform Cost (monthly)" value={platformMonthly} onChange={setPlatformMonthly} min={0} prefix="$" />
          <NumField label="AI Usage (monthly)" value={aiUsageMonthly} onChange={setAiUsageMonthly} min={0} prefix="$" />
          <NumField label="Implementation (one-time)" value={implOneTime} onChange={setImplOneTime} min={0} prefix="$" />
          <NumField label="Amortization (months)" value={amortMonths} onChange={setAmortMonths} min={1} />
        </div>
      </section>

      {/* Calculation Summary (closed by default) */}
      <details className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <summary className="cursor-pointer select-none text-sm font-medium">
          Calculation Summary
        </summary>
        <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          Benefit: portion of repetitive work shifts from humans to AI agents; adoption ramps over time.
          Hours saved = employees × minutes/task × tasks/month × automation% × adoption% × 12 months.
          Program Cost: monthly platform + AI usage + implementation amortized.
          Net Impact: Net benefit = annual labor savings − total annual costs; ROI% = net ÷ costs × 100.
        </div>
      </details>

      {/* Workflows */}
      <section className="mt-8 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Workflows</h2>
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setTemplateOpen((v) => !v)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              + Add from templates
            </button>
            {templateOpen && (
              <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-2 flex items-center justify-between">
                  <input
                    autoFocus
                    placeholder="Search templates…"
                    value={templateQuery}
                    onChange={(e) => setTemplateQuery(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    onClick={() => setTemplateOpen(false)}
                    className="ml-2 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Close templates"
                  >
                    ×
                  </button>
                </div>
                <ul className="max-h-64 overflow-auto text-sm">
                  {filteredTemplates.length === 0 && (
                    <li className="px-2 py-1 text-slate-500">No matches</li>
                  )}
                  {filteredTemplates.map((name) => (
                    <li key={name}>
                      <button
                        onClick={() => {
                          addRow(name);
                          setTemplateQuery("");
                          setTemplateOpen(false);
                        }}
                        className="w-full rounded-md px-2 py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {/* Force predictable widths so Name never truncates badly */}
          <table className="min-w-full table-fixed border-collapse text-sm">
            {/* IMPORTANT: no stray whitespace inside <colgroup> */}
            <colgroup>{cols}</colgroup>
            <thead>
              <tr className="text-left">
                <Th>Name</Th>
                <Th>Min/Task</Th>
                <Th>{linkPeople ? "Tasks/Person/Month" : "Tasks/Month"}</Th>
                {linkPeople && <Th>Participants</Th>}
                {linkPeople && <Th>Efficiency %</Th>}
                <Th>People</Th>
                <Th>Hourly</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <Td className="align-top">
                    <TextField value={r.name} onChange={(v) => updateRow(r.id, { name: v })} />
                  </Td>
                  <Td>
                    <NumField value={r.minPerTask} onChange={(v) => updateRow(r.id, { minPerTask: v })} min={0} />
                  </Td>
                  <Td>
                    <NumField
                      value={r.tasksPerMonth}
                      onChange={(v) => updateRow(r.id, { tasksPerMonth: v })}
                      min={0}
                    />
                  </Td>
                  <Td>
                    <NumField
                      value={r.people}
                      onChange={(v) => updateRow(r.id, { people: v })}
                      min={0}
                    />
                  </Td>
                  <Td>
                    <NumField
                      value={r.automationPct}
                      onChange={(v) => updateRow(r.id, { automationPct: clamp(v, 0, 100) })}
                      min={0}
                      max={100}
                    />
                  </Td>
                  <Td>
                    <NumField
                      value={r.hourly}
                      onChange={(v) => updateRow(r.id, { hourly: v })}
                      min={0}
                      prefix="$"
                    />
                  </Td>
                  <Td>
                    <button
                      onClick={() => removeRow(r.id)}
                      className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer / SEO helper text */}
      <footer className="mt-10 text-xs text-slate-500 dark:text-slate-400">
        Results are estimates; see disclaimer in the PDF. For definitions, visit{" "}
        <Link href="/glossary" className="underline">
          Glossary
        </Link>
        .
      </footer>
    </main>
  );

  /* ---- actions for rows ---- */
  function addRow(name = "") {
    setRows((prev) => [
      ...prev,
      {
        id: uid(),
        name,
        minPerTask: 5,
        tasksPerMonth: 500,
        people: 1,
        automationPct: 50,
        hourly: 45,
      },
    ]);
  }
  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }
  function updateRow(id: string, patch: Partial<Workflow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
}

/* ------------------------------ SMALL UI BITS ------------------------------- */

function DashCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (accent
          ? "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-200"
          : "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100")
      }
    >
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
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
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600 " +
        className
      }
    />
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  prefix,
  className = "",
}: {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
  className?: string;
}) {
  return (
    <label className={"block " + className}>
      {label ? (
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </span>
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
            const clamped = clamp(
              n,
              min ?? Number.MIN_SAFE_INTEGER,
              max ?? Number.MAX_SAFE_INTEGER
            );
            onChange(clamped);
          }}
          className={
            "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600 " +
            (prefix ? "pl-7" : "")
          }
        />
      </div>
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-slate-200 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-2 py-2 " + className}>{children}</td>;
}

/* ------------------------------- PDF helper -------------------------------- */

function wrapText(
  pdf: jsPDF,
  text: string,
  x: number,
  maxWidth: number,
  y: number,
  lineHeight = 16
) {
  const lines = pdf.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

