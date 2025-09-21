"use client";

import React, { useMemo, useState } from "react";

// ------------------ helpers ------------------
const HOURS_PER_FTE = 2080;
const SCHEDULER_URL = "https://calendly.com/rick-hancock-rhconsulting/30min";

const currency = (n: number, c: string = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);

const num0 = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);

function clamp(v: number, min: number, max: number) {
  if (isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function buildURL(base: string, params: Record<string, string | number>) {
  const q = new URLSearchParams(Object.entries(params).reduce((acc: Record<string, string>, [k, v]) => {
    acc[k] = String(v);
    return acc;
  }, {}));
  return `${base}?${q.toString()}`;
}

// ------------------ number field (free typing, no-steppers) ------------------
type NumberFieldProps = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
};

function NumberField({
  value,
  onChange,
  min = 0,
  max = 1_000_000,
  step = 1,
  className,
  placeholder,
}: NumberFieldProps) {
  const [text, setText] = useState<string>(String(value));

  // keep local string in sync if parent value changes elsewhere
  React.useEffect(() => {
    setText(String(value));
  }, [value]);

  function parseToNumber(s: string) {
    // allow blank while typing; commit on blur
    if (s.trim() === "") return NaN;
    // remove commas, spaces, $ etc
    const cleaned = s.replace(/[^\d.\-]/g, "");
    // handle lone "-" or "."
    if (cleaned === "-" || cleaned === "." || cleaned === "-.") return NaN;
    const n = Number(cleaned);
    return isFinite(n) ? n : NaN;
  }

  return (
    <input
      inputMode="decimal"
      type="text"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const s = e.target.value;
        setText(s);
        const n = parseToNumber(s);
        if (!isNaN(n)) {
          const clamped = clamp(Math.round(n / step) * step, min, max);
          onChange(clamped);
        }
      }}
      onBlur={() => {
        const n = parseToNumber(text);
        const finalN = isNaN(n) ? value : clamp(Math.round(n / step) * step, min, max);
        setText(String(finalN));
        onChange(finalN);
      }}
      className={
        className ??
        "h-10 w-full rounded-xl bg-slate-900/30 dark:bg-slate-900/40 border border-slate-800 px-3 text-slate-100 outline-none focus:ring-2 ring-brand-500/40"
      }
    />
  );
}

// ------------------ types ------------------
interface Row {
  id: string;
  name: string;
  minutesPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationRate: number; // %
  hourlyCost: number; // loaded $/hr
}

interface Costs {
  platformMonthly: number;
  aiMonthly: number;
  implementationOneTime: number;
  amortizeMonths: number;
}

// ------------------ page ------------------
export default function ROIPage() {
  // Default: friendly SMB baseline (~100 employees)
  const [rows, setRows] = useState<Row[]>([
    {
      id: crypto.randomUUID(),
      name: "Lead qualification",
      minutesPerTask: 6,
      tasksPerMonth: 100,
      people: 10,
      automationRate: 60,
      hourlyCost: 45,
    },
    {
      id: crypto.randomUUID(),
      name: "FAQ / info requests",
      minutesPerTask: 4,
      tasksPerMonth: 600,
      people: 1,
      automationRate: 55,
      hourlyCost: 40,
    },
  ]);

  const [costs, setCosts] = useState<Costs>({
    platformMonthly: 300,
    aiMonthly: 180,
    implementationOneTime: 2500,
    amortizeMonths: 12,
  });

  // --- derived totals ---
  const computed = useMemo(() => {
    const perRow = rows.map((r) => {
      const hoursSaved =
        (r.minutesPerTask / 60) * r.tasksPerMonth * 12 * (r.automationRate / 100) * r.people;
      const annualSaved = hoursSaved * r.hourlyCost;
      return { id: r.id, hoursSaved, annualSaved };
    });

    const totalHours = perRow.reduce((a, b) => a + b.hoursSaved, 0);
    const totalLaborSavings = perRow.reduce((a, b) => a + b.annualSaved, 0);

    const annualPlatform = costs.platformMonthly * 12;
    const annualAI = costs.aiMonthly * 12;
    const amortized =
      costs.amortizeMonths > 0 ? costs.implementationOneTime / costs.amortizeMonths * 12 : 0;

    const totalAnnualCosts = annualPlatform + annualAI + amortized;
    const net = totalLaborSavings - totalAnnualCosts;
    const roi = totalAnnualCosts > 0 ? (net / totalAnnualCosts) : 0;

    return {
      perRow,
      totalHours,
      fte: totalHours / HOURS_PER_FTE,
      totalLaborSavings,
      annualPlatform,
      annualAI,
      amortized,
      totalAnnualCosts,
      net,
      roi,
    };
  }, [rows, costs]);

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((rs) => [
      ...rs,
      {
        id: crypto.randomUUID(),
        name: "New workflow",
        minutesPerTask: 5,
        tasksPerMonth: 200,
        people: 1,
        automationRate: 50,
        hourlyCost: 40,
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  const schedulerURL = buildURL(SCHEDULER_URL, {
    hours: Math.round(computed.totalHours),
    fte: computed.fte.toFixed(1),
    labor_savings: Math.round(computed.totalLaborSavings),
    annual_costs: Math.round(computed.totalAnnualCosts),
    roi_pct: Math.round(computed.roi * 100),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">
        Agentic Automation ROI
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Estimate time and cost savings from AI agents across your workflows.{" "}
        <span className="text-slate-300">
          Defaults shown for a 100-employee SMB. Adjust for your company size.
        </span>
      </p>

      {/* summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Hours saved / yr" value={num0(computed.totalHours)} sub={`≈ ${computed.fte.toFixed(1)} FTE`} />
        <SummaryCard label="FTE equivalent" value={computed.fte.toFixed(1)} />
        <SummaryCard label="Labor savings / yr" value={currency(computed.totalLaborSavings)} />
        <SummaryCard
          label="ROI"
          value={`${Math.round(computed.roi * 100)}%`}
          valueClass={computed.net >= 0 ? "text-emerald-400" : "text-rose-400"}
        />
      </div>

      <a
        href={schedulerURL}
        className="inline-flex mt-6 h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 font-medium text-emerald-950 hover:bg-emerald-400 transition"
      >
        Book a Call (passes your ROI numbers)
      </a>

      {/* workflows table */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="grid grid-cols-12 gap-3 pb-3 text-xs font-medium text-slate-400">
          <div className="col-span-3">Workflow</div>
          <div className="col-span-1 text-center">Min/Task</div>
          <div className="col-span-2 text-center">Tasks / mo</div>
          <div className="col-span-1 text-center">People</div>
          <div className="col-span-2 text-center">Automation %</div>
          <div className="col-span-1 text-center">Hourly $</div>
          <div className="col-span-1 text-right">Annual $ saved</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-3">
          {rows.map((r, i) => {
            const derived = computed.perRow.find((x) => x.id === r.id);
            const annualSaved = derived ? derived.annualSaved : 0;

            return (
              <div
                key={r.id}
                className="grid grid-cols-12 gap-3 items-center rounded-xl border border-slate-800 bg-slate-950/40 p-3"
              >
                <input
                  type="text"
                  value={r.name}
                  onChange={(e) => updateRow(r.id, { name: e.target.value })}
                  className="col-span-3 h-10 rounded-xl bg-slate-900/30 border border-slate-800 px-3 text-slate-100 outline-none focus:ring-2 ring-brand-500/40"
                />
                <div className="col-span-1">
                  <NumberField value={r.minutesPerTask} onChange={(n) => updateRow(r.id, { minutesPerTask: clamp(n, 0, 600) })} min={0} max={600} />
                </div>
                <div className="col-span-2">
                  <NumberField value={r.tasksPerMonth} onChange={(n) => updateRow(r.id, { tasksPerMonth: clamp(n, 0, 100000) })} min={0} max={100000} />
                </div>
                <div className="col-span-1">
                  <NumberField value={r.people} onChange={(n) => updateRow(r.id, { people: clamp(n, 0, 100000) })} min={0} max={100000} />
                </div>
                <div className="col-span-2">
                  <NumberField value={r.automationRate} onChange={(n) => updateRow(r.id, { automationRate: clamp(n, 0, 100) })} min={0} max={100} />
                </div>
                <div className="col-span-1">
                  <NumberField value={r.hourlyCost} onChange={(n) => updateRow(r.id, { hourlyCost: clamp(n, 0, 10000) })} min={0} max={10000} />
                </div>
                <div className="col-span-1 text-right text-slate-200 font-medium">
                  {currency(annualSaved)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => removeRow(r.id)}
                    className="text-rose-400 hover:text-rose-300 text-sm"
                    aria-label={`Remove ${r.name || `row ${i + 1}`}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <button
            onClick={addRow}
            className="h-10 rounded-xl border border-slate-700 px-4 text-slate-200 hover:bg-slate-800/60"
          >
            + Add workflow
          </button>
        </div>
      </div>

      {/* costs */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Program costs</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <LabeledNumber
            label="Platform cost / mo"
            value={costs.platformMonthly}
            onChange={(n) => setCosts((c) => ({ ...c, platformMonthly: clamp(n, 0, 1_000_000) }))}
          />
          <LabeledNumber
            label="AI usage / mo"
            value={costs.aiMonthly}
            onChange={(n) => setCosts((c) => ({ ...c, aiMonthly: clamp(n, 0, 1_000_000) }))}
          />
          <LabeledNumber
            label="Implementation (one-time)"
            value={costs.implementationOneTime}
            onChange={(n) => setCosts((c) => ({ ...c, implementationOneTime: clamp(n, 0, 10_000_000) }))}
          />
          <LabeledNumber
            label="Amortize over (months)"
            value={costs.amortizeMonths}
            onChange={(n) => setCosts((c) => ({ ...c, amortizeMonths: clamp(n, 1, 60) }))}
            min={1}
            max={60}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile label="Total annual costs" value={currency(computed.totalAnnualCosts)} />
          <StatTile label="Net benefit" value={currency(computed.net)} valueClass={computed.net >= 0 ? "text-emerald-400" : "text-rose-400"} />
          <StatTile label="ROI" value={`${Math.round(computed.roi * 100)}%`} valueClass={computed.net >= 0 ? "text-emerald-400" : "text-rose-400"} />
        </div>
      </div>

      <div className="mt-6">
        <a
          href={schedulerURL}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 font-medium text-emerald-950 hover:bg-emerald-400 transition"
        >
          Book a Call with These Results
        </a>
      </div>
    </div>
  );
}

// ------------------ small UI bits ------------------
function SummaryCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold text-slate-100 ${valueClass ?? ""}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
    );
}

function LabeledNumber({
  label,
  value,
  onChange,
  min = 0,
  max = 1_000_000,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <NumberField value={value} onChange={onChange} min={min} max={max} />
    </div>
  );
}

function StatTile({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-semibold text-slate-100 ${valueClass ?? ""}`}>{value}</div>
    </div>
  );
}

