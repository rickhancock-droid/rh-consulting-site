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

// Map workflow names to stable keys so we can preset participation by mode
const WF_KEYS: Record<string, "cx" | "std" | "inc" | "other"> = {
  "Customer Experience Ops": "cx",
  "Automation Standardization": "std",
  "Incident & Resiliency Ops": "inc",
};

// Participation % presets by mode
const PARTICIPATION_PRESETS: Record<
  Mode,
  Record<"cx" | "std" | "inc" | "other", number>
> = {
  conservative: { cx: 25, std: 20, inc: 10, other: 8 },
  typical: { cx: 30, std: 25, inc: 15, other: 10 },
  optimal: { cx: 40, std: 30, inc: 20, other: 12 },
};

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
  tasksPerPerson: number; // per person per month
  participationPct: number; // locked by mode presets
  automationPct: number; // 0–100
  hourly: number;
  effectiveOverride?: number; // manual override of effective employees
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
];

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

const clamp01 = (v: number) => clamp(v, 0, 100);

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

  /* === Default rows (3) chosen for “Typical” ROI ===
     Note: tasksPerPerson chosen to preserve your baseline ROI when “Typical” (70%) */
  const [rows, setRows] = useState<Workflow[]>([
    {
      id: uid(),
      name: "Customer Experience Ops",
      minPerTask: 4, // mins
      tasksPerPerson: 40,
      participationPct: PARTICIPATION_PRESETS["typical"]["cx"],
      automationPct: 60,
      hourly: 45,
    },
    {
      id: uid(),
      name: "Automation Standardization",
      minPerTask: 8,
      tasksPerPerson: 28,
      participationPct: PARTICIPATION_PRESETS["typical"]["std"],
      automationPct: 55,
      hourly: 45,
    },
    {
      id: uid(),
      name: "Incident & Resiliency Ops",
      minPerTask: 10,
      tasksPerPerson: 14,
      participationPct: PARTICIPATION_PRESETS["typical"]["inc"],
      automationPct: 50,
      hourly: 45,
    },
  ]);

  /* === Template dropdown (one-click close) === */
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

  /* === Lock participation % to the selected mode (public calculator) === */
  useEffect(() => {
    setRows((prev) =>
      prev.map((r) => {
        const key = WF_KEYS[r.name] ?? "other";
        return { ...r, participationPct: PARTICIPATION_PRESETS[mode][key] };
      })
    );
  }, [mode]);

  /* === Derived calculations ===
     IMPORTANT: we include Adoption inside Effective Employees to avoid double counting.
  */
  const {
    annualHours,
    annualLaborSavings,
    annualCosts,
    netBenefit,
    roiPct,
    wfBreakdown,
  } = useMemo(() => {
    const wfBreakdown = rows.map((r) => {
      const computedEff = Math.round(
        employees * (r.participationPct / 100) * (adoption / 100)
      );
      const effectiveEmployees =
        typeof r.effectiveOverride === "number"
          ? Math.max(0, Math.trunc(r.effectiveOverride))
          : computedEff;

      const hours =
        (r.minPerTask / 60) *
        r.tasksPerPerson *
        effectiveEmployees *
        12 *
        (r.automationPct / 100);

      const dollars = hours * r.hourly;

      return { id: r.id, name: r.name, hours, dollars, effectiveEmployees };
    });

    const annualHours = wfBreakdown.reduce((a, b) => a + b.hours, 0);
    const annualLaborSavings = wfBreakdown.reduce((a, b) => a + b.dollars, 0);

    const annualizedImpl = implOneTime / Math.max(1, amortMonths);
    const annualCosts =
      platformMonthly * 12 + aiUsageMonthly * 12 + annualizedImpl;

    const netBenefit = annualLaborSavings - annualCosts;
    const roiPct = annualCosts > 0 ? (netBenefit / annualCosts) * 100 : 0;

    return {
      annualHours,
      annualLaborSavings,
      annualCosts,
      netBenefit,
      roiPct,
      wfBreakdown,
    };
  }, [
    rows,
    employees,
    adoption,
    platformMonthly,
    aiUsageMonthly,
    implOneTime,
    amortMonths,
  ]);

  /* === Adopted headcount back-propagates to the slider (sum of auto rows) === */
  const autoEffectiveSum = useMemo(() => {
    // Sum only rows that are NOT overridden
    const totalAuto = rows.reduce((sum, r) => {
      if (typeof r.effectiveOverride === "number") return sum;
      const eff = Math.round(
        employees * (r.participationPct / 100) * (adoption / 100)
      );
      return sum + eff;
    }, 0);
    return totalAuto;
  }, [rows, employees, adoption]);

  /* ======= PDF ======= */
  const pageRef = useRef<HTMLDivElement>(null);

  async function handlePdf() {
    if (!pageRef.current) return;

    const isDark = document.documentElement.classList.contains("dark");
    const canvas = await html2canvas(pageRef.current, {
      backgroundColor: isDark ? "#0b1220" : "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    let y = 40;

    // Header (logo + title)
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
      } catch {
        /* ignore logo fetch errs */
      }
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(
      "AI Agent ROI Calculator (Digital Labor) — ROI Results",
      40,
      (y += 60)
    );

    // Key metrics
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    const line1 =
      `Annual Hours Saved: ${fmtInt(annualHours)}  |  ` +
      `Annual Labor Savings: ${fmtMoney(annualLaborSavings)}  |  ` +
      `Total Annual Costs: ${fmtMoney(annualCosts)}  |  ` +
      `Net Benefit: ${fmtMoney(netBenefit)}  |  ROI: ${fmtInt(roiPct)}%`;
    y = wrapText(pdf, line1, 40, pageW - 80, (y += 16), 16);

    // Calculation Summary
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Calculation Summary", 40, (y += 24));
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    const calcSummary =
      "Benefit: Portion of repetitive work shifts from humans to AI agents; adoption ramps over time. " +
      "Hours saved = minutes/task ÷ 60 × tasks/person/month × effective employees × 12 × automation%.\n" +
      "Effective employees = round(employees × participation% × adoption%).\n\n" +
      "Program Cost: Monthly platform + AI usage + implementation amortized across selected months.\n\n" +
      "Net Impact: Net benefit = annual labor savings − total annual costs; ROI% = net ÷ costs × 100.";
    y = wrapText(pdf, calcSummary, 40, pageW - 80, (y += 10), 16);

    // Full-page image of the calculator
    const imgW = pageW - 80;
    const imgH = (canvas.height * imgW) / canvas.width;
    if (y + imgH > pageH - 80) {
      pdf.addPage();
      y = 40;
    }
    pdf.addImage(imgData, "PNG", 40, (y += 20), imgW, imgH);
    y += imgH;

    // New page: Case Study 1 + Glossary + Disclaimer
    pdf.addPage();
    y = 40;

    const cs = CASE_STUDIES[0];
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(cs.title, 40, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    y = wrapText(pdf, `Client: ${cs.client}`, 40, pageW - 80, (y += 18), 16);
    y = wrapText(pdf, `Problem: ${cs.problem}`, 40, pageW - 80, (y += 14), 16);
    y = wrapText(pdf, `Solution: ${cs.solution}`, 40, pageW - 80, (y += 14), 16);
    y = wrapText(pdf, `Outcome: ${cs.outcome}`, 40, pageW - 80, (y += 14), 16);
    y = wrapText(
      pdf,
      `Why it matters: ${cs.why}`,
      40,
      pageW - 80,
      (y += 14),
      16
    );

    // Glossary
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Appendix — Glossary (selected terms)", 40, (y += 28));
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    for (const g of PDF_GLOSSARY) {
      y = wrapText(pdf, `• ${g.term}: ${g.def}`, 40, pageW - 80, (y += 16), 16);
      if (y > pageH - 80) {
        pdf.addPage();
        y = 40;
      }
    }

    // Disclaimer (short)
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

    // Save & notify
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
    } catch {
      // non-blocking
    }
  }

  /* ----------------------------------- UI ----------------------------------- */

  return (
    <main ref={pageRef} className="mx-auto max-w-6xl px-4 py-8">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            AI Agent ROI Calculator{" "}
            <span className="text-orange-500">(Digital Labor)</span>
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
              Automation adoption: <span className="font-semibold">{adoption}%</span>
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
          Hours saved = minutes/task ÷ 60 × tasks/person/month × <b>effective employees</b> × 12 × automation%.<br />
          Effective employees = round(employees × participation% × adoption%). Participation is set by scenario (Conservative / Typical / Optimal).
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
                          const key = WF_KEYS[name] ?? "other";
                          setRows((prev) => [
                            ...prev,
                            {
                              id: uid(),
                              name,
                              minPerTask: 5,
                              tasksPerPerson: 20,
                              participationPct: PARTICIPATION_PRESETS[mode][key],
                              automationPct: 50,
                              hourly: 45,
                            },
                          ]);
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
          {/* Fixed widths; keep participation & hourly narrow; room for Delete */}
          <table className="min-w-full table-fixed border-collapse text-sm">
            <colgroup><col className="w-[28%]"/><col className="w-[9%]"/><col className="w-[14%]"/><col className="w-[10%]"/><col className="w-[14%]"/><col className="w-[9%]"/><col className="w-[8%]"/><col className="w-[8%]"/></colgroup>
            <thead>
              <tr className="text-left">
                <Th>Name</Th>
                <Th>Min/Task</Th>
                <Th>Tasks/Person</Th>
                <Th>Participation %</Th>
                <Th>Effective Employees</Th>
                <Th>Automation %</Th>
                <Th>Hourly</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const computedEff = Math.round(
                  employees * (r.participationPct / 100) * (adoption / 100)
                );
                const isOverridden =
                  typeof r.effectiveOverride === "number" &&
                  Number.isFinite(r.effectiveOverride);
                const effValue = isOverridden
                  ? Math.max(0, Math.trunc(r.effectiveOverride as number))
                  : computedEff;

                return (
                  <tr
                    key={r.id}
                    className="border-t border-slate-200 dark:border-slate-700"
                  >
                    <Td>
                      <TextField
                        value={r.name}
                        onChange={(v) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, name: v } : x
                            )
                          )
                        }
                      />
                    </Td>
                    <Td>
                      <NumField
                        value={r.minPerTask}
                        onChange={(v) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, minPerTask: v } : x
                            )
                          )
                        }
                        min={0}
                      />
                    </Td>
                    <Td>
                      <NumField
                        value={r.tasksPerPerson}
                        onChange={(v) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, tasksPerPerson: v } : x
                            )
                          )
                        }
                        min={0}
                      />
                    </Td>
                    <Td>
                      {/* locked by mode; read-only */}
                      <NumField
                        value={r.participationPct}
                        onChange={() => {}}
                        min={0}
                        max={100}
                        readOnly
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <NumField
                          value={effValue}
                          onChange={(v) =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? { ...x, effectiveOverride: Math.max(0, Math.trunc(v)) }
                                  : x
                              )
                            )
                          }
                          min={0}
                        />
                        {isOverridden ? (
                          <button
                            onClick={() =>
                              setRows((prev) =>
                                prev.map((x) =>
                                  x.id === r.id
                                    ? { ...x, effectiveOverride: undefined }
                                    : x
                                )
                              )
                            }
                            className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Use automatic calculation"
                          >
                            Reset
                          </button>
                        ) : (
                          <span className="text-[11px] rounded bg-slate-200/60 px-1 py-0.5 dark:bg-slate-700/60">
                            auto
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <NumField
                        value={r.automationPct}
                        onChange={(v) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id
                                ? { ...x, automationPct: clamp01(v) }
                                : x
                            )
                          )
                        }
                        min={0}
                        max={100}
                      />
                    </Td>
                    <Td>
                      <NumField
                        value={r.hourly}
                        onChange={(v) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, hourly: v } : x
                            )
                          )
                        }
                        min={0}
                        prefix="$"
                      />
                    </Td>
                    <Td>
                      <button
                        onClick={() =>
                          setRows((prev) => prev.filter((x) => x.id !== r.id))
                        }
                        className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Tiny helper text showing current auto headcount sum (for sanity) */}
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Auto-mode effective employees (sum of non-overridden rows):{" "}
            <span className="font-medium">{fmtInt(autoEffectiveSum)}</span>
          </div>
        </div>
      </section>

      {/* Footer / SEO helper text for crawlers */}
      <footer className="mt-10 text-xs text-slate-500 dark:text-slate-400">
        Results are estimates; see disclaimer in the PDF. For definitions, visit{" "}
        <Link href="/glossary" className="underline">
          Glossary
        </Link>
        .
      </footer>
    </main>
  );
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

/** Smarter numeric field: allows temporary blanks, commits on blur/Enter */
function NumField({
  label,
  value,
  onChange,
  min,
  max,
  prefix,
  className = "",
  readOnly = false,
}: {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
  className?: string;
  readOnly?: boolean;
}) {
  const [text, setText] = useState<string>(String(value));
  useEffect(() => {
    setText(String(value));
  }, [value]);

  function commit(raw: string) {
    if (readOnly) return;
    const cleaned = raw.replace(/[^0-9]/g, "");
    if (cleaned === "") {
      // If left blank, revert to last value (no jump to 1)
      setText(String(value));
      return;
    }
    let n = parseInt(cleaned, 10);
    if (Number.isFinite(min)) n = Math.max(min!, n);
    if (Number.isFinite(max)) n = Math.min(max!, n);
    onChange(n);
  }

  return (
    <label className={"block " + className}>
      {label ? (
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </span>
      ) : null}
      <div className={"relative " + (readOnly ? "opacity-60" : "")} title={readOnly ? "Set by scenario" : undefined}>
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
            {prefix}
          </span>
        ) : null}
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={text}
          readOnly={readOnly}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit((e.target as HTMLInputElement).value);
            }
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
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-2 align-middle">{children}</td>;
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

