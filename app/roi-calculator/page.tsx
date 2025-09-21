"use client";

import React, { useMemo, useState } from "react";

// ---------- compact input helpers (free typing + clamps) ----------
type NumProps = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  suffix?: string;
};
function NumberField({
  value,
  onChange,
  min = 0,
  max = 1_000_000,
  step = 1,
  className = "",
  suffix,
}: NumProps) {
  // keep raw text so backspace/leading zero work naturally
  const [txt, setTxt] = useState(String(value));
  // mirror upstream changes
  React.useEffect(() => setTxt(String(value)), [value]);

  function parseAndCommit(s: string) {
    const cleaned = s.replace(/[^\d.\-]/g, "");
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return;
    onChange(Math.min(max, Math.max(min, n)));
  }

  return (
    <div className={`relative`}>
      <input
        inputMode="decimal"
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        onBlur={(e) => parseAndCommit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={`h-9 w-full rounded-md bg-slate-900/30 dark:bg-slate-900/40 border border-slate-700/60 px-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 ${className}`}
      />
      {!!suffix && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {suffix}
        </span>
      )}
      <div className="hidden">
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
        />
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
        />
      </div>
    </div>
  );
}

// ---------- types ----------
type Row = {
  id: string;
  name: string;
  minutes: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number;
  hourly: number;
};

// ---------- defaults (SMB ~100 employees vibe) ----------
const DEFAULT_ROWS: Row[] = [
  {
    id: "lead-qual",
    name: "Lead qualification",
    minutes: 6,
    tasksPerMonth: 100,
    people: 10,
    automationPct: 60,
    hourly: 45,
  },
  {
    id: "faq",
    name: "FAQ / info requests",
    minutes: 4,
    tasksPerMonth: 600,
    people: 1,
    automationPct: 55,
    hourly: 40,
  },
];

const HOURS_PER_FTE = 2080;

function currency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(isFinite(n) ? n : 0);
}
const fmt1 = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    isFinite(n) ? n : 0
  );

// ---------- page ----------
export default function ROIPage() {
  // program-level inputs (compact row)
  const [adoption, setAdoption] = useState(80); // slider label remains
  const [platformMo, setPlatformMo] = useState(300);
  const [usageMo, setUsageMo] = useState(180);
  const [implOneTime, setImplOneTime] = useState(2500);
  const [amortizeMonths, setAmortizeMonths] = useState(12);

  // rows
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);

  function setRow<K extends keyof Row>(id: string, key: K, v: Row[K]) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [key]: v } : x)));
  }
  function addRow() {
    const id = crypto.randomUUID();
    setRows((r) => [
      ...r,
      {
        id,
        name: "New workflow",
        minutes: 3,
        tasksPerMonth: 300,
        people: 1,
        automationPct: 50,
        hourly: 40,
      },
    ]);
  }
  function removeRow(id: string) {
    setRows((r) => r.filter((x) => x.id !== id));
  }

  // ---------- math ----------
  const calc = useMemo(() => {
    const adopt = adoption / 100;
    const detailed = rows.map((r) => {
      const hoursSaved =
        (r.minutes / 60) * r.tasksPerMonth * r.people * (r.automationPct / 100) * adopt * 12;
      const dollars = hoursSaved * r.hourly;
      return { ...r, hoursSaved, dollars };
    });

    const totalHours = detailed.reduce((s, d) => s + d.hoursSaved, 0);
    const laborSavings = detailed.reduce((s, d) => s + d.dollars, 0);

    const annualPlatform = platformMo * 12;
    const annualUsage = usageMo * 12;
    const annualizedImpl =
      amortizeMonths > 0 ? (implOneTime * 12) / amortizeMonths : 0;
    const totalCosts = annualPlatform + annualUsage + annualizedImpl;

    const net = laborSavings - totalCosts;
    const roiPct = totalCosts > 0 ? (net / totalCosts) * 100 : Infinity;

    return {
      adopt,
      detailed,
      totalHours,
      fte: totalHours / HOURS_PER_FTE,
      laborSavings,
      costs: { annualPlatform, annualUsage, annualizedImpl, totalCosts },
      net,
      roiPct,
    };
  }, [rows, adoption, platformMo, usageMo, implOneTime, amortizeMonths]);

  // ---------- layout (compact) ----------
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 text-slate-100">
      <h1 className="text-3xl font-semibold tracking-tight">AI ROI Calculators</h1>
      <p className="mt-1 text-sm text-slate-400">
        Estimate time & cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
      </p>

      {/* Top summary — single row, compact cards */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <Card title="Hours saved / yr" value={`${fmt1(calc.totalHours)} hrs`} hint={`≈ ${fmt1(calc.fte)} FTE`} />
        <Card title="FTE equivalent" value={fmt1(calc.fte)} hint="based on 2080 hrs/yr" />
        <Card title="Labor savings / yr" value={currency(calc.laborSavings)} />
        <Card
          title="ROI"
          value={`${fmt1(calc.roiPct)}%`}
          accent={calc.net >= 0 ? "text-emerald-400" : "text-rose-400"}
        />
      </div>

      {/* Program costs (very compact) */}
      <div className="mt-3 grid grid-cols-5 gap-3 rounded-lg border border-slate-800/70 bg-slate-900/30 p-3">
        {/* Adoption slider (kept—people liked it) */}
        <div className="col-span-2">
          <label className="flex items-center justify-between text-xs text-slate-300">
            <span>Adoption Rate (%)</span>
            <span className="text-slate-400">{adoption}% of eligible work</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={adoption}
            onChange={(e) => setAdoption(Number(e.target.value))}
            className="mt-1 h-1.5 w-full cursor-pointer accent-sky-400"
          />
        </div>

        <Field label="Platform cost / mo">
          <NumberField value={platformMo} onChange={setPlatformMo} />
        </Field>
        <Field label="AI usage / mo">
          <NumberField value={usageMo} onChange={setUsageMo} />
        </Field>
        <Field label="Implementation (one-time)">
          <NumberField value={implOneTime} onChange={setImplOneTime} />
        </Field>
        <Field label="Amortize over (months)">
          <NumberField value={amortizeMonths} onChange={setAmortizeMonths} min={1} />
        </Field>
      </div>

      {/* Workflows table — compact density */}
      <div className="mt-4 rounded-lg border border-slate-800/70 bg-slate-900/30">
        <div className="grid grid-cols-12 gap-2 border-b border-slate-800/60 px-3 py-2 text-xs text-slate-400">
          <div className="col-span-3">Workflow</div>
          <div className="col-span-1 text-center">Min/Task</div>
          <div className="col-span-2 text-center">Tasks / mo</div>
          <div className="col-span-1 text-center">People</div>
          <div className="col-span-2 text-center">Automation %</div>
          <div className="col-span-1 text-center">Hourly $</div>
          <div className="col-span-1 text-right pr-1">Annual $ saved</div>
          <div className="col-span-1" />
        </div>

        {calc.detailed.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-12 gap-2 border-b border-slate-800/40 px-3 py-2 last:border-0"
          >
            <input
              value={r.name}
              onChange={(e) => setRow(r.id, "name", e.target.value)}
              className="col-span-3 h-9 rounded-md bg-slate-900/40 border border-slate-700/60 px-2 text-slate-100"
            />
            <div className="col-span-1">
              <NumberField value={r.minutes} onChange={(n) => setRow(r.id, "minutes", n)} />
            </div>
            <div className="col-span-2">
              <NumberField
                value={r.tasksPerMonth}
                onChange={(n) => setRow(r.id, "tasksPerMonth", n)}
              />
            </div>
            <div className="col-span-1">
              <NumberField value={r.people} onChange={(n) => setRow(r.id, "people", n)} />
            </div>
            <div className="col-span-2">
              <NumberField
                value={r.automationPct}
                onChange={(n) => setRow(r.id, "automationPct", n)}
              />
            </div>
            <div className="col-span-1">
              <NumberField value={r.hourly} onChange={(n) => setRow(r.id, "hourly", n)} />
            </div>
            <div className="col-span-1 flex items-center justify-end pr-1 text-slate-200">
              {currency(r.dollars)}
            </div>
            <div className="col-span-1 flex items-center justify-end">
              <button
                onClick={() => removeRow(r.id)}
                className="text-xs text-rose-300 hover:text-rose-200"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between px-3 py-2">
          <button
            onClick={addRow}
            className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
          >
            + Add workflow
          </button>

          <div className="flex gap-3 text-sm text-slate-300">
            <span>Total annual costs:</span>
            <strong className="text-slate-100">{currency(calc.costs.totalCosts)}</strong>
          </div>
        </div>
      </div>

      {/* Bottom KPI band — single row */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <Stat title="Annual hours saved" value={`${fmt1(calc.totalHours)}`} suffix="hrs" />
        <Stat title="Annual labor savings" value={currency(calc.laborSavings)} />
        <Stat title="Total annual costs" value={currency(calc.costs.totalCosts)} smallHint="platform + usage + build" />
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Net benefit / ROI</div>
          <div className="mt-1 text-2xl font-semibold">
            <span className={calc.net >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {currency(calc.net)}
            </span>
          </div>
          <div className="text-xs text-slate-400">{fmt1(calc.roiPct)}% ROI</div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4">
        <a
          href="https://calendly.com/rick-hancock-rhconsulting/30min"
          className="inline-flex h-10 items-center rounded-md bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Book a Call (passes your ROI numbers)
        </a>
      </div>

      {/* ROI explainer (collapsible) */}
      <details className="mt-6 rounded-lg border border-slate-800/70 bg-slate-900/30 p-4 text-sm">
        <summary className="cursor-pointer select-none font-medium text-slate-200">
          How we calculate ROI
        </summary>
        <div className="prose prose-invert mt-3 text-slate-300">
          <ul>
            <li>
              <strong>Hours saved / workflow</strong> = minutes per task × tasks/mo × people ×
              automation% × adoption% × 12 months.
            </li>
            <li>
              <strong>Annual $ saved</strong> = hours saved × hourly cost (loaded).
            </li>
            <li>
              <strong>Total annual costs</strong> = (platform/mo + AI usage/mo) × 12 + (implementation ÷
              amortize months) × 12.
            </li>
            <li>
              <strong>Net benefit</strong> = annual labor savings − total annual costs.
            </li>
            <li>
              <strong>ROI %</strong> = net benefit ÷ total annual costs.
            </li>
          </ul>
          <p className="mt-2">
            Defaults mirror a typical <em>~100-employee SMB</em>. Tune adoption and automation% to
            your reality. We can also model software license consolidation or additional headcount
            lift on a live call.
          </p>
        </div>
      </details>
    </div>
  );
}

// ---------- small presentational bits ----------
function Card({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
      <div className="text-xs text-slate-400">{title}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ?? ""}`}>{value}</div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs text-slate-300">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Stat({
  title,
  value,
  suffix,
  smallHint,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  smallHint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold">
        {value} {suffix && <span className="text-base text-slate-400">{suffix}</span>}
      </div>
      {smallHint && <div className="text-xs text-slate-500">{smallHint}</div>}
    </div>
  );
}

