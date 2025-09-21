// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

/** -------------------- Config -------------------- **/
const CALENDLY_URL =
  "https://calendly.com/rick-hancock-rhconsulting/30min";

const WORKFLOW_SUGGESTIONS = [
  "Lead qualification",
  "FAQ / info requests",
  "Inbound email triage",
  "CRM data entry",
  "Order processing",
  "Appointment scheduling",
  "Ticket routing & tagging",
  "Knowledge-base answer drafting",
  "Invoice reconciliation",
];

type Workflow = {
  id: string;
  name: string;
  minPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0-100
  hourly: number;
};

const fmtMoney0 = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(isFinite(n) ? n : 0);

const fmt1 = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    isFinite(n) ? n : 0
  );

const clamp = (v: number, mi: number, ma: number) =>
  Math.max(mi, Math.min(ma, v));

const HOURS_PER_FTE = 2080;

/** --------------- Safe numeric input --------------- **/
function numOr(v: string, fallback = 0) {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}
function InputNumber(props: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}) {
  const { value, onChange, step = 1, min = 0, max = 1e9, className } = props;
  return (
    <input
      inputMode="decimal"
      pattern="[0-9]*"
      value={String(value)}
      onChange={(e) => onChange(clamp(numOr(e.target.value, 0), min, max))}
      onBlur={(e) => onChange(clamp(numOr(e.target.value, 0), min, max))}
      step={step}
      className={
        className ??
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      }
    />
  );
}

/** ----------------- Main component ----------------- **/
export default function RoiCalculatorPage() {
  // Program-level inputs (defaults aimed at ~100-employee SMB)
  const [adoption, setAdoption] = useState<number>(80); // %
  const [platformAnnual, setPlatformAnnual] = useState<number>(12000);
  const [aiUsageAnnual, setAiUsageAnnual] = useState<number>(6000);
  const [implOneTime, setImplOneTime] = useState<number>(5000);
  const [implMonths, setImplMonths] = useState<number>(12);

  // Workflow rows (two by default)
  const [rows, setRows] = useState<Workflow[]>([
    {
      id: crypto.randomUUID(),
      name: "FAQ / info requests",
      minPerTask: 4,
      tasksPerMonth: 1500,
      people: 2,
      automationPct: 60,
      hourly: 35,
    },
    {
      id: crypto.randomUUID(),
      name: "Lead qualification",
      minPerTask: 7,
      tasksPerMonth: 600,
      people: 1,
      automationPct: 50,
      hourly: 45,
    },
  ]);

  /** ------- Derived calculations ------- **/
  const derived = useMemo(() => {
    const annualPlatform = platformAnnual;
    const annualAI = aiUsageAnnual;
    const annualImpl = implMonths > 0 ? (implOneTime * 12) / implMonths : 0;
    const totalAnnualCosts = annualPlatform + annualAI + annualImpl;

    // Hours saved & labor savings across all workflows
    const rowCalcs = rows.map((r) => {
      const hoursPerTask = r.minPerTask / 60;
      const annualTasks = r.tasksPerMonth * 12;
      const hoursSaved =
        hoursPerTask * annualTasks * (r.automationPct / 100) * (adoption / 100);
      const laborSavings = hoursSaved * r.hourly;
      return { ...r, hoursSaved, laborSavings };
    });

    const totalHours = rowCalcs.reduce((s, r) => s + r.hoursSaved, 0);
    const totalLabor = rowCalcs.reduce((s, r) => s + r.laborSavings, 0);
    const fteSaved = totalHours / HOURS_PER_FTE;

    const netBenefit = totalLabor - totalAnnualCosts;
    const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : 0;
    return {
      rowCalcs,
      totalHours,
      totalLabor,
      fteSaved,
      annualPlatform,
      annualAI,
      annualImpl,
      totalAnnualCosts,
      netBenefit,
      roiPct,
    };
  }, [
    rows,
    adoption,
    platformAnnual,
    aiUsageAnnual,
    implOneTime,
    implMonths,
  ]);

  /** ------- Handlers ------- **/
  function addRow(suggest?: string) {
    setRows((r) => [
      ...r,
      {
        id: crypto.randomUUID(),
        name: suggest ?? "",
        minPerTask: 5,
        tasksPerMonth: 400,
        people: 1,
        automationPct: 50,
        hourly: 40,
      },
    ]);
  }
  function updateRow(id: string, patch: Partial<Workflow>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function removeRow(id: string) {
    setRows((r) => r.filter((x) => x.id !== id));
  }

  /** ------- UI ------- **/
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Top header line: title + explainer + CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            AI ROI Calculators
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Estimate time &amp; cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>

        {/* ROI card + Calendly */}
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-right dark:border-emerald-800 dark:bg-emerald-950/40">
            <div className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              ROI
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {fmt1(derived.roiPct)}%
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300">
              {fmtMoney0(derived.netBenefit)}
            </div>
          </div>

          <Link
            href={`${CALENDLY_URL}?roi=${encodeURIComponent(
              fmt1(derived.roiPct)
            )}&net=${encodeURIComponent(fmtMoney0(derived.netBenefit))}`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500"
          >
            Book a call with these results
          </Link>
        </div>
      </div>

      {/* Dashboard summary (4 tiles) */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Annual hrs saved"
          value={`${fmt1(derived.totalHours)} hrs`}
        />
        <StatCard
          label="Annual labor savings"
          value={fmtMoney0(derived.totalLabor)}
        />
        <StatCard
          label="Total annual costs"
          value={fmtMoney0(derived.totalAnnualCosts)}
        />
        <StatCard
          label="Net benefit"
          value={fmtMoney0(derived.netBenefit)}
          accent="green"
        />
      </div>

      {/* Program-level inputs */}
      <section className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Program settings
        </h2>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
              Adoption (% of eligible work)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={adoption}
                onChange={(e) => setAdoption(Number(e.target.value))}
                className="w-full"
              />
              <InputNumber
                value={adoption}
                onChange={(v) => setAdoption(clamp(v, 0, 100))}
                min={0}
                max={100}
                className="w-20 text-center"
              />
            </div>
          </div>
          <NumberField
            label="Platform cost (annual)"
            value={platformAnnual}
            onChange={setPlatformAnnual}
            prefix="$"
          />
          <NumberField
            label="AI usage (annual)"
            value={aiUsageAnnual}
            onChange={setAiUsageAnnual}
            prefix="$"
          />
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
              Implementation (one-time) / months
            </label>
            <div className="flex items-center gap-2">
              <InputNumber
                value={implOneTime}
                onChange={setImplOneTime}
                className="w-full"
              />
              <span className="text-slate-500">÷</span>
              <InputNumber
                value={implMonths}
                onChange={(v) => setImplMonths(clamp(v, 1, 60))}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Workflows
          </h2>
          {/* Searchable suggestion */}
          <WorkflowSuggest onPick={(name) => addRow(name)} />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3">
          {derived.rowCalcs.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                    Workflow name
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    value={r.name}
                    onChange={(e) => updateRow(r.id, { name: e.target.value })}
                  />
                </div>

                <NumberField
                  label="Minutes per task"
                  value={r.minPerTask}
                  onChange={(v) => updateRow(r.id, { minPerTask: v })}
                />
                <NumberField
                  label="Tasks per month"
                  value={r.tasksPerMonth}
                  onChange={(v) => updateRow(r.id, { tasksPerMonth: v })}
                />
                <NumberField
                  label="People"
                  value={r.people}
                  onChange={(v) => updateRow(r.id, { people: v })}
                />

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-xs text-slate-600 dark:text-slate-400">
                      Hourly $
                    </label>
                    <button
                      onClick={() => removeRow(r.id)}
                      className="text-[11px] font-medium text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <InputNumber
                    value={r.hourly}
                    onChange={(v) => updateRow(r.id, { hourly: v })}
                  />
                </div>
              </div>

              {/* automation slider */}
              <div className="mt-3">
                <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Automation rate ({r.automationPct}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={r.automationPct}
                  onChange={(e) =>
                    updateRow(r.id, { automationPct: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              {/* per-row summary */}
              <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat
                  label="Annual hours saved"
                  value={`${fmt1(r.hoursSaved)} hrs`}
                />
                <MiniStat
                  label="Labor savings"
                  value={fmtMoney0(r.laborSavings)}
                />
                <MiniStat
                  label="FTE saved"
                  value={fmt1(r.hoursSaved / HOURS_PER_FTE)}
                />
                <MiniStat label="People" value={String(r.people)} />
              </div>
            </div>
          ))}
        </div>

        {/* Add new row */}
        <div className="mt-3">
          <button
            onClick={() => addRow()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/50"
          >
            + Add workflow
          </button>
        </div>
      </section>

      {/* Calculation summary (accordion) */}
      <details className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-slate-100">
          Calculation Summary
        </summary>
        <div className="prose prose-sm dark:prose-invert max-w-none pt-3">
          <p>
            <strong>Benefit.</strong> We estimate hours saved by multiplying minutes per task × tasks per month × 12 × automation rate × program adoption. Labor savings = hours saved × hourly rate. FTE saved uses ~2080 hrs/year.
          </p>
          <p>
            <strong>Costs.</strong> Total annual cost = platform (annual) + AI usage (annual) + implementation (one-time amortized across your chosen months).
          </p>
          <p>
            <strong>ROI.</strong> ROI% = (Net Benefit ÷ Total Annual Cost) × 100, where Net Benefit = Labor Savings − Total Annual Cost.
          </p>
        </div>
      </details>

      {/* Disclaimer (always visible) */}
      <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        The results of this tool are illustrative and not a guarantee. Actual outcomes vary by implementation, adoption,
        configuration, practices, and market conditions. All calculations shown in USD unless noted.
      </p>
    </div>
  );
}

/** ---------------- Small UI pieces ---------------- **/
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green";
}) {
  const base =
    "rounded-xl border px-4 py-3 text-sm dark:border-slate-800 bg-white dark:bg-slate-950";
  const color =
    accent === "green"
      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950";
  return (
    <div className={`${base} ${color}`}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {prefix ? (
          <span className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            {prefix}
          </span>
        ) : null}
        <InputNumber value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function WorkflowSuggest({ onPick }: { onPick: (name: string) => void }) {
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return WORKFLOW_SUGGESTIONS.slice(0, 5);
    return WORKFLOW_SUGGESTIONS.filter((w) => w.toLowerCase().includes(s)).slice(
      0,
      8
    );
  }, [q]);

  return (
    <div className="relative w-full max-w-xs">
      <input
        placeholder="Search workflows…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      {matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {matches.map((m) => (
            <button
              key={m}
              onClick={() => {
                onPick(m);
                setQ("");
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

