// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

// ---------------- theme helpers (light/dark card & border) ----------------
const cardBase =
  "rounded-2xl border shadow-sm px-6 py-5 transition-colors";
const card =
  `${cardBase} bg-gray-50 border-gray-200 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100`;
const cardEmphasis =
  `${cardBase} bg-orange-50 border-orange-200 text-gray-900 dark:bg-slate-800 dark:border-orange-400/40 dark:text-slate-100`;
const pill =
  "inline-flex items-center justify-center h-10 px-4 rounded-full bg-violet-500 text-white hover:bg-violet-600 transition-colors";

// ---------------- types ----------------
type Workflow = {
  name: string;
  minPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0-100
  hourly: number;
};

type Totals = {
  hoursSavedYr: number;
  fte: number;
  laborSavingsYr: number;
  totalAnnualCosts: number;
  netBenefit: number;
  roiPct: number;
};

// ---------------- constants ----------------
const DEFAULT_WORKFLOWS: readonly string[] = [
  "Lead qualification",
  "FAQ / info requests",
  "Customer support (tier 1)",
  "CRM data entry",
  "Order status updates",
  "Invoice follow-ups",
  "Scheduling",
  "Onboarding FAQs",
  "Internal IT helpdesk",
];

const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Math.round(n)
  );
const HRS = (n: number) =>
  `${Math.round(n * 10) / 10} hrs`;

// ---------------- calc helpers ----------------
function hoursSavedPerWorkflow(w: Workflow, adoptionPct: number): number {
  // minutes per task × tasks/mo × people × automation% × adoption% × 12 / 60
  const hrsMo =
    (w.minPerTask * w.tasksPerMonth * Math.max(w.people, 0) * (w.automationPct / 100) * (adoptionPct / 100)) / 60;
  return hrsMo * 12;
}

function totals(
  workflows: Workflow[],
  adoptionPct: number,
  platformPerMo: number,
  aiUsagePerMo: number,
  implementationOneTime: number,
  amortizeMonths: number
): Totals {
  const hoursSavedYr = workflows.reduce((acc, w) => acc + hoursSavedPerWorkflow(w, adoptionPct), 0);
  const laborSavingsYr = workflows.reduce(
    (acc, w) => acc + hoursSavedPerWorkflow(w, adoptionPct) * w.hourly,
    0
  );
  const annualizedImpl = amortizeMonths > 0 ? (implementationOneTime / amortizeMonths) * 12 : implementationOneTime;
  const totalAnnualCosts = platformPerMo * 12 + aiUsagePerMo * 12 + annualizedImpl;
  const netBenefit = Math.max(laborSavingsYr - totalAnnualCosts, laborSavingsYr === 0 ? 0 : laborSavingsYr - totalAnnualCosts);
  const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : 0;
  const fte = hoursSavedYr / 2080;

  return { hoursSavedYr, fte, laborSavingsYr, totalAnnualCosts, netBenefit, roiPct };
}

// ---------------- component ----------------
export default function RoiCalculatorPage() {
  // Defaults that mirror ~100-employee SMB
  const [adoptionPct, setAdoptionPct] = useState<number>(80);
  const [platformPerMo, setPlatformPerMo] = useState<number>(300);
  const [aiUsagePerMo, setAiUsagePerMo] = useState<number>(180);
  const [implementationOneTime, setImplementationOneTime] = useState<number>(2500);
  const [amortizeMonths, setAmortizeMonths] = useState<number>(12);

  const [workflows, setWorkflows] = useState<Workflow[]>([
    { name: "Lead qualification", minPerTask: 6, tasksPerMonth: 100, people: 10, automationPct: 60, hourly: 45 },
    { name: "FAQ / info requests", minPerTask: 4, tasksPerMonth: 600, people: 1, automationPct: 55, hourly: 40 },
  ]);

  const t = useMemo(
    () =>
      totals(workflows, adoptionPct, platformPerMo, aiUsagePerMo, implementationOneTime, amortizeMonths),
    [workflows, adoptionPct, platformPerMo, aiUsagePerMo, implementationOneTime, amortizeMonths]
  );

  // ---------- handlers ----------
  const updateWorkflow = <K extends keyof Workflow>(
    idx: number,
    key: K,
    value: Workflow[K]
  ) => {
    setWorkflows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const addWorkflow = () =>
    setWorkflows((prev) => [
      ...prev,
      { name: "", minPerTask: 3, tasksPerMonth: 300, people: 1, automationPct: 50, hourly: 40 },
    ]);

  const removeWorkflow = (idx: number) =>
    setWorkflows((prev) => prev.filter((_, i) => i !== idx));

  // ---------- UI helpers ----------
  const numberCls =
    "h-11 w-full rounded-xl bg-white/80 border border-gray-300 px-3 text-gray-900 placeholder:text-gray-500 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100";
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300";

  // ---------- JSX ----------
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Top row: title + CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-slate-100">
            AI ROI Calculators
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-300">
            Estimate time & cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>
        <Link
          className={pill}
          href={{
            pathname: "https://calendly.com/rh-consulting-ai/30min",
            query: {
              hours: t.hoursSavedYr.toFixed(1),
              fte: (Math.round(t.fte * 10) / 10).toString(),
              labor: Math.round(t.laborSavingsYr).toString(),
              costs: Math.round(t.totalAnnualCosts).toString(),
              net: Math.round(t.netBenefit).toString(),
              roi: Math.round(t.roiPct).toString(),
            },
          }}
          target="_blank"
        >
          Book a Call (passes your ROI)
        </Link>
      </div>

      {/* Dashboard cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={card}>
          <div className={labelCls}>Annual Hours Saved</div>
          <div className="mt-2 text-2xl font-semibold">{HRS(t.hoursSavedYr)}</div>
          <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">≈ {(Math.round(t.fte * 10) / 10)} FTE</div>
        </div>
        <div className={card}>
          <div className={labelCls}>Annual Labor Savings</div>
          <div className="mt-2 text-2xl font-semibold">{USD(t.laborSavingsYr)}</div>
          <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">before software costs</div>
        </div>
        <div className={card}>
          <div className={labelCls}>Total Annual Costs</div>
          <div className="mt-2 text-2xl font-semibold">{USD(t.totalAnnualCosts)}</div>
          <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">platform + usage + build</div>
        </div>
        <div className={cardEmphasis + " ring-1 ring-orange-300/50 dark:ring-0"}>
          <div className="flex items-center justify-between">
            <div className={labelCls}>Net Benefit / ROI</div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-500">{USD(t.netBenefit)}</div>
          <div className="mt-1 text-sm font-medium text-emerald-500">
            {Math.round(t.roiPct)}% ROI
          </div>
        </div>
      </div>

      {/* Program inputs row */}
      <div className={`${card} mt-6`}>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div>
            <div className={labelCls}>Adoption Rate (%)</div>
            <input
              type="range"
              min={0}
              max={100}
              value={adoptionPct}
              onChange={(e) => setAdoptionPct(Number(e.target.value))}
              className="mt-2 w-full accent-violet-500"
            />
            <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {adoptionPct}% of eligible work
            </div>
          </div>
          <div>
            <div className={labelCls}>Platform cost / mo</div>
            <input
              className={`${numberCls} mt-2`}
              value={platformPerMo}
              onChange={(e) => setPlatformPerMo(Number(e.target.value || 0))}
              inputMode="numeric"
            />
          </div>
          <div>
            <div className={labelCls}>AI usage / mo</div>
            <input
              className={`${numberCls} mt-2`}
              value={aiUsagePerMo}
              onChange={(e) => setAiUsagePerMo(Number(e.target.value || 0))}
              inputMode="numeric"
            />
          </div>
          <div>
            <div className={labelCls}>Implementation (one-time)</div>
            <input
              className={`${numberCls} mt-2`}
              value={implementationOneTime}
              onChange={(e) => setImplementationOneTime(Number(e.target.value || 0))}
              inputMode="numeric"
            />
          </div>
          <div>
            <div className={labelCls}>Amortize (months)</div>
            <input
              className={`${numberCls} mt-2`}
              value={amortizeMonths}
              onChange={(e) => setAmortizeMonths(Number(e.target.value || 0))}
              inputMode="numeric"
            />
          </div>
        </div>
      </div>

      {/* Workflows table */}
      <div className={`${card} mt-6`}>
        <div className="grid grid-cols-12 gap-3 text-sm">
          <div className="col-span-4 sm:col-span-3 md:col-span-3 lg:col-span-3">
            <div className={labelCls}>Workflow</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className={labelCls}>Min/Task</div>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <div className={labelCls}>Tasks/mo</div>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <div className={labelCls}>People</div>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <div className={labelCls}>Automation %</div>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <div className={labelCls}>Hourly $</div>
          </div>
          <div className="col-span-2 sm:col-span-2 text-right">
            <div className={labelCls}>Annual $ saved</div>
          </div>
        </div>

        <datalist id="workflow-options">
          {DEFAULT_WORKFLOWS.map((w) => (
            <option value={w} key={w} />
          ))}
        </datalist>

        {workflows.map((w, idx) => {
          const saved = hoursSavedPerWorkflow(w, adoptionPct) * w.hourly;
          return (
            <div key={idx} className="mt-3 grid grid-cols-12 gap-3 items-center">
              {/* Searchable dropdown (datalist) */}
              <div className="col-span-4 sm:col-span-3 md:col-span-3 lg:col-span-3">
                <input
                  list="workflow-options"
                  className={numberCls}
                  value={w.name}
                  onChange={(e) => updateWorkflow(idx, "name", e.target.value)}
                  placeholder="Select or type workflow…"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <input
                  className={numberCls}
                  value={w.minPerTask}
                  onChange={(e) => updateWorkflow(idx, "minPerTask", Number(e.target.value || 0))}
                  inputMode="numeric"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <input
                  className={numberCls}
                  value={w.tasksPerMonth}
                  onChange={(e) => updateWorkflow(idx, "tasksPerMonth", Number(e.target.value || 0))}
                  inputMode="numeric"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <input
                  className={numberCls}
                  value={w.people}
                  onChange={(e) => updateWorkflow(idx, "people", Number(e.target.value || 0))}
                  inputMode="numeric"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <input
                  className={numberCls}
                  value={w.automationPct}
                  onChange={(e) => updateWorkflow(idx, "automationPct", Number(e.target.value || 0))}
                  inputMode="numeric"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <input
                  className={numberCls}
                  value={w.hourly}
                  onChange={(e) => updateWorkflow(idx, "hourly", Number(e.target.value || 0))}
                  inputMode="numeric"
                />
              </div>

              <div className="col-span-2 sm:col-span-2 text-right text-gray-900 dark:text-slate-100 font-medium">
                {USD(saved)}
              </div>

              <div className="col-span-12 flex justify-end">
                <button
                  className="text-sm text-rose-500 hover:text-rose-600"
                  onClick={() => removeWorkflow(idx)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        <div className="mt-4">
          <button className="rounded-xl px-4 py-2 bg-gray-900 text-white hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600"
            onClick={addWorkflow}
          >
            + Add workflow
          </button>
        </div>
      </div>

      {/* Explainer */}
      <details className={`${card} mt-6`}>
        <summary className="cursor-pointer text-base font-semibold">How we calculate ROI</summary>
        <ul className="mt-4 space-y-3 text-gray-700 dark:text-slate-300">
          <li><strong>Hours saved / workflow</strong> = minutes per task × tasks/mo × people × automation% × adoption% × 12 months ÷ 60.</li>
          <li><strong>Annual $ saved</strong> = hours saved × hourly cost (loaded).</li>
          <li><strong>Total annual costs</strong> = (platform/mo + AI usage/mo) × 12 + (implementation ÷ amortize months) × 12.</li>
          <li><strong>Net benefit</strong> = annual labor savings − total annual costs.</li>
          <li><strong>ROI %</strong> = net benefit ÷ total annual costs.</li>
        </ul>
        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
          Defaults mirror a typical ~100-employee SMB. Tune adoption and automation% to your reality.
        </p>
      </details>
    </div>
  );
}
