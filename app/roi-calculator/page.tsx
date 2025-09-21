// app/roi-calculator/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ---------- Config ----------
const CALENDLY_URL =
  "https://calendly.com/rick-hancock-rhconsulting/30min?utm_source=roi"; // update if needed

// Nice, short list of suggested workflows (searchable via <datalist/>)
const WORKFLOW_SUGGESTIONS = [
  "Lead qualification",
  "FAQ / info requests",
  "Inbound email triage",
  "CRM data entry",
  "Order processing",
  "Appointment scheduling",
  "Ticket routing & tagging",
  "Knowledge-base draft answers",
  "Invoice reconciliation",
];

// Colors (Tailwind utility classes)
const ORANGE_BTN =
  "inline-flex items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900";
const KPI_CARD =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const SECTION_CARD =
  "rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

// ---------- Types ----------
type Workflow = {
  id: string;
  name: string;
  minutesPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0..100
  hourly: number; // loaded hourly cost
};

type ProgramCosts = {
  monthlyPlatformCost: number;
  monthlyAIUsageCost: number;
  implementationCost: number; // one-time
  implementationAmortMonths: number; // months
};

// ---------- Helpers ----------
const toCurrency = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

const toNum1 = (n: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(Number.isFinite(n) ? n : 0);

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const HOURS_PER_FTE = 2080;

// ---------- Smart Number Field (free typing & backspace) ----------
type NumberFieldProps = {
  label?: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  suffix?: string;
};

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  className,
  suffix,
}: NumberFieldProps) {
  const [text, setText] = useState<string>(String(value));
  const lastValue = useRef<number>(value);

  useEffect(() => {
    // keep input in sync if parent value changes elsewhere
    if (value !== lastValue.current) {
      lastValue.current = value;
      setText(String(value));
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const t = e.target.value;
    setText(t);
    // If it's a clean number, propagate immediately; otherwise wait for blur
    const num = Number(t);
    if (!Number.isNaN(num) && t.trim() !== "") {
      let v = num;
      if (min !== undefined) v = Math.max(min, v);
      if (max !== undefined) v = Math.min(max, v);
      lastValue.current = v;
      onChange(v);
    }
  }

  function handleBlur() {
    const num = Number(text);
    let v = Number.isNaN(num) ? value : num;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    lastValue.current = v;
    setText(String(v));
    onChange(v);
  }

  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      {label && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}
      <div className="relative">
        <input
          inputMode="decimal"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-900/40"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          step={step}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

// ---------- Main Page ----------
export default function RoiCalculatorPage() {
  // Program-level inputs
  const [adoptionPct, setAdoptionPct] = useState<number>(80); // % of eligible work using agents
  const [currency] = useState<string>("USD");

  const [costs, setCosts] = useState<ProgramCosts>({
    monthlyPlatformCost: 1200,
    monthlyAIUsageCost: 600,
    implementationCost: 12000,
    implementationAmortMonths: 12,
  });

  // Workflows
  const [rows, setRows] = useState<Workflow[]>([
    {
      id: cryptoRandom(),
      name: "FAQ / info requests",
      minutesPerTask: 4,
      tasksPerMonth: 1500,
      people: 3,
      automationPct: 60,
      hourly: 40,
    },
    {
      id: cryptoRandom(),
      name: "Lead qualification",
      minutesPerTask: 6,
      tasksPerMonth: 600,
      people: 2,
      automationPct: 50,
      hourly: 45,
    },
  ]);

  function cryptoRandom() {
    // small unique id
    return Math.random().toString(36).slice(2, 9);
  }

  function updateRow(id: string, patch: Partial<Workflow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: cryptoRandom(),
        name: "",
        minutesPerTask: 5,
        tasksPerMonth: 500,
        people: 1,
        automationPct: 40,
        hourly: 45,
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  // ---------- Calculations ----------
  const results = useMemo(() => {
    // per-row
    const perRow = rows.map((r) => {
      const monthlyMinutesSaved =
        r.minutesPerTask *
        r.tasksPerMonth *
        r.people *
        (adoptionPct / 100) *
        (r.automationPct / 100);
      const annualHoursSaved = (monthlyMinutesSaved * 12) / 60;
      const laborSavings = annualHoursSaved * r.hourly;
      return { ...r, annualHoursSaved, laborSavings };
    });

    // totals
    const totalHoursSaved = perRow.reduce((a, b) => a + b.annualHoursSaved, 0);
    const totalLaborSavings = perRow.reduce((a, b) => a + b.laborSavings, 0);

    const annualPlatform = costs.monthlyPlatformCost * 12;
    const annualAIUsage = costs.monthlyAIUsageCost * 12;
    const annualizedImpl =
      costs.implementationAmortMonths > 0
        ? (costs.implementationCost * 12) / costs.implementationAmortMonths
        : costs.implementationCost; // guard divide-by-0

    const totalAnnualCosts = annualPlatform + annualAIUsage + annualizedImpl;

    const netBenefit = totalLaborSavings - totalAnnualCosts;
    const roiPct =
      totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : 0;

    const fteSaved = totalHoursSaved / HOURS_PER_FTE;

    return {
      perRow,
      totalHoursSaved,
      totalLaborSavings,
      totalAnnualCosts,
      netBenefit,
      roiPct,
      fteSaved,
      annualPlatform,
      annualAIUsage,
      annualizedImpl: annualizedImpl,
    };
  }, [rows, adoptionPct, costs]);

  // ---------- Export helpers (CSV & PDF light) ----------
  function downloadCSV() {
    const headers = [
      "Workflow",
      "Minutes/Task",
      "Tasks/Month",
      "People",
      "Automation%",
      "Hourly$",
      "Annual Hours Saved",
      "Labor Savings",
    ];
    const body = results.perRow
      .map((r) =>
        [
          r.name,
          r.minutesPerTask,
          r.tasksPerMonth,
          r.people,
          r.automationPct,
          r.hourly,
          toNum1(r.annualHoursSaved),
          Math.round(r.laborSavings),
        ].join(",")
      )
      .join("\n");
    const totals = [
      "",
      "",
      "",
      "",
      "",
      "",
      toNum1(results.totalHoursSaved),
      Math.round(results.totalLaborSavings),
    ].join(",");

    const csv = [headers.join(","), body, totals].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roi-summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Basic PDF (screenshot of the calculator area). You already installed html2canvas & jspdf.
  async function downloadPDF() {
    const area = document.getElementById("roi-area");
    if (!area) return;
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(area, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 24;
    const usable = pageWidth - margin * 2;
    const imgWidth = usable;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    pdf.text("RH Consulting — ROI Summary", margin, 28);
    pdf.addImage(imgData, "PNG", margin, 40, imgWidth, imgHeight);
    pdf.save("RH-Consulting-ROI.pdf");
  }

  // ---------- UI ----------
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8" id="roi-area">
      {/* Top: title + CTA aligned to a single row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            AI ROI Calculators
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Estimate time &amp; cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>

        <a
          className={ORANGE_BTN}
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Book a call with these results
        </a>
      </div>

      {/* KPI row (ROI big + 4 tiles) */}
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className={`${KPI_CARD} md:col-span-1 flex flex-col justify-center`}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            ROI
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {toNum1(results.roiPct)}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Net Benefit / Total Costs
          </div>
        </div>

        <div className={`${KPI_CARD}`}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Annual Hours Saved
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {toNum1(results.totalHoursSaved)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            ≈ {toNum1(results.fteSaved)} FTE
          </div>
        </div>

        <div className={`${KPI_CARD}`}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Annual Labor Savings
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {toCurrency(results.totalLaborSavings, currency)}
          </div>
        </div>

        <div className={`${KPI_CARD}`}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Annual Costs
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {toCurrency(results.totalAnnualCosts, currency)}
          </div>
        </div>

        <div className={`${KPI_CARD}`}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Net Benefit
          </div>
          <div className="mt-1 text-lg font-semibold text-emerald-600">
            {toCurrency(results.netBenefit, currency)}
          </div>
        </div>
      </div>

      {/* Adoption + Costs */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className={`${SECTION_CARD} md:col-span-1`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Adoption
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              % of eligible work using agents
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={adoptionPct}
              onChange={(e) => setAdoptionPct(Number(e.target.value))}
              className="w-full accent-orange-600"
            />
            <div className="w-14 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
              {adoptionPct}%
            </div>
          </div>
        </div>

        <div className={`${SECTION_CARD} md:col-span-2`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Program Costs
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <NumberField
              label="Platform (monthly)"
              value={costs.monthlyPlatformCost}
              onChange={(n) =>
                setCosts((c) => ({ ...c, monthlyPlatformCost: Math.max(0, n) }))
              }
              min={0}
              step={50}
              suffix="$"
            />
            <NumberField
              label="AI Usage (monthly)"
              value={costs.monthlyAIUsageCost}
              onChange={(n) =>
                setCosts((c) => ({ ...c, monthlyAIUsageCost: Math.max(0, n) }))
              }
              min={0}
              step={25}
              suffix="$"
            />
            <NumberField
              label="Implementation (one-time)"
              value={costs.implementationCost}
              onChange={(n) =>
                setCosts((c) => ({ ...c, implementationCost: Math.max(0, n) }))
              }
              min={0}
              step={500}
              suffix="$"
            />
            <NumberField
              label="Amortize (months)"
              value={costs.implementationAmortMonths}
              onChange={(n) =>
                setCosts((c) => ({
                  ...c,
                  implementationAmortMonths: clamp(Math.round(n), 1, 36),
                }))
              }
              min={1}
              max={36}
              step={1}
            />
          </div>
        </div>
      </div>

      {/* Workflows */}
      <div className={`${SECTION_CARD} mt-5`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Workflows
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadCSV}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Export CSV
            </button>
            <button onClick={downloadPDF} className={ORANGE_BTN}>
              Download PDF
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {rows.map((r, idx) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              {/* Top row: Name + Remove on the right */}
              <div className="flex items-start justify-between gap-3">
                <label className="flex-1">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Workflow name
                  </span>
                  <div className="relative mt-1">
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-900/40"
                      value={r.name}
                      onChange={(e) => updateRow(r.id, { name: e.target.value })}
                      list="workflow-suggestions"
                      placeholder="Start typing (e.g., Lead qualification)…"
                    />
                    <datalist id="workflow-suggestions">
                      {WORKFLOW_SUGGESTIONS.map((w) => (
                        <option key={w} value={w} />
                      ))}
                    </datalist>
                  </div>
                </label>

                <button
                  onClick={() => removeRow(r.id)}
                  className="rounded-md border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-950 dark:hover:bg-rose-900/10"
                >
                  REMOVE
                </button>
              </div>

              {/* Inputs grid */}
              <div className="mt-3 grid gap-3 md:grid-cols-6">
                <NumberField
                  label="Minutes / Task"
                  value={r.minutesPerTask}
                  onChange={(n) => updateRow(r.id, { minutesPerTask: Math.max(0, n) })}
                  min={0}
                  step={1}
                />
                <NumberField
                  label="Tasks / Month"
                  value={r.tasksPerMonth}
                  onChange={(n) => updateRow(r.id, { tasksPerMonth: Math.max(0, Math.round(n)) })}
                  min={0}
                  step={10}
                />
                <NumberField
                  label="People"
                  value={r.people}
                  onChange={(n) => updateRow(r.id, { people: clamp(Math.round(n), 0, 5000) })}
                  min={0}
                  step={1}
                />
                <NumberField
                  label="Automation %"
                  value={r.automationPct}
                  onChange={(n) =>
                    updateRow(r.id, { automationPct: clamp(Math.round(n), 0, 100) })
                  }
                  min={0}
                  max={100}
                  step={5}
                  suffix="%"
                />
                <NumberField
                  label="Hourly $"
                  value={r.hourly}
                  onChange={(n) => updateRow(r.id, { hourly: Math.max(0, n) })}
                  min={0}
                  step={5}
                  suffix="$"
                />

                {/* Per-row summary */}
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Annual hours saved
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {toNum1(
                          ((r.minutesPerTask *
                            r.tasksPerMonth *
                            r.people *
                            (adoptionPct / 100) *
                            (r.automationPct / 100) *
                            12) /
                            60) as number
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Labor savings
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {toCurrency(
                          (((r.minutesPerTask *
                            r.tasksPerMonth *
                            r.people *
                            (adoptionPct / 100) *
                            (r.automationPct / 100) *
                            12) /
                            60) as number) * r.hourly,
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add workflow button (tight to the list) */}
          <div>
            <button onClick={addRow} className={ORANGE_BTN}>
              + Add workflow
            </button>
          </div>
        </div>
      </div>

      {/* Calculation Summary (accordion) */}
      <div className={`${SECTION_CARD} mt-5`}>
        <details>
          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-900 dark:text-slate-100">
            Calculation Summary
          </summary>
          <div className="prose prose-slate dark:prose-invert mt-3 max-w-none text-sm">
            <p>
              <strong>Benefit:</strong> A target portion of eligible work shifts from
              humans to AI agents. Hours saved are estimated by multiplying{" "}
              <em>minutes per task × tasks per month × 12 × people × adoption% × automation%</em>{" "}
              and dividing by 60 to convert to hours. Productivity gains are valued
              using the <em>loaded hourly cost</em>.
            </p>
            <p>
              <strong>Program Costs:</strong> Your total annual cost is the sum of{" "}
              platform + AI usage (both multiplied by 12) + implementation (amortized
              over the selected months). <em>ROI = Net Benefit ÷ Total Costs</em>.
            </p>
            <p>
              Use this model to approximate savings for typical SMB scenarios (~100
              employees). Adjust inputs to match your workload and pay scales.
            </p>
          </div>
        </details>
      </div>

      {/* Disclaimer (always visible) */}
      <div className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        <p>
          <strong>Disclaimer:</strong> The results of this tool are provided for
          illustrative purposes only and should not be relied upon as a guarantee of
          outcomes. Actual results vary based on implementation practices, user
          adoption, configurations, business processes, market conditions, and other
          external factors. Values shown are estimates in US dollars unless noted.
        </p>
      </div>

      {/* Bottom link back to site pages */}
      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/"
          className="text-slate-600 underline-offset-2 hover:underline dark:text-slate-300"
        >
          Home
        </Link>
        <span className="text-slate-400">•</span>
        <Link
          href="/privacy"
          className="text-slate-600 underline-offset-2 hover:underline dark:text-slate-300"
        >
          Privacy
        </Link>
        <span className="text-slate-400">•</span>
        <Link
          href="/accessibility"
          className="text-slate-600 underline-offset-2 hover:underline dark:text-slate-300"
        >
          Accessibility
        </Link>
      </div>
    </div>
  );
}

