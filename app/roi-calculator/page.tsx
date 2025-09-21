// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type Workflow = {
  id: string;
  name: string;
  minutesPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0..100
  hourlyCost: number;
};

type ProgramCosts = {
  platformPerMonth: number;
  aiUsagePerMonth: number;
  implementationOneTime: number;
  amortizeMonths: number; // >= 1
};

const HOURS_PER_FTE = 2080;

// ------- helpers (safe number typing) -------
function parseNumLoose(v: string, fallback = 0) {
  // allow "", "-", ".", etc while typing — treat as NaN then fallback
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
const num1 = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n);

// ------- main -------
export default function ROIPage() {
  const [rows, setRows] = useState<Workflow[]>([
    {
      id: crypto.randomUUID(),
      name: "Lead qualification",
      minutesPerTask: 6,
      tasksPerMonth: 100,
      people: 10,
      automationPct: 60,
      hourlyCost: 45,
    },
    {
      id: crypto.randomUUID(),
      name: "FAQ / info requests",
      minutesPerTask: 4,
      tasksPerMonth: 600,
      people: 1,
      automationPct: 55,
      hourlyCost: 40,
    },
  ]);

  const [costs, setCosts] = useState<ProgramCosts>({
    platformPerMonth: 300,
    aiUsagePerMonth: 180,
    implementationOneTime: 2500,
    amortizeMonths: 12,
  });

  // ------- calculations -------
  const calc = useMemo(() => {
    // hours saved per row = minutes * tasks/mo * automation% * 12 / 60
    const rowHours = rows.map((r) => {
      const h =
        (r.minutesPerTask * r.tasksPerMonth * (r.automationPct / 100) * 12) /
        60;
      const $saved = h * r.hourlyCost;
      return { id: r.id, hours: h, dollars: $saved };
    });

    const totalHours = rowHours.reduce((a, b) => a + b.hours, 0);
    const fte = totalHours / HOURS_PER_FTE;
    const laborSavings = rowHours.reduce((a, b) => a + b.dollars, 0);

    const annualPlatform = costs.platformPerMonth * 12;
    const annualAI = costs.aiUsagePerMonth * 12;
    const implAnnualized =
      costs.amortizeMonths > 0
        ? (costs.implementationOneTime * 12) / costs.amortizeMonths
        : costs.implementationOneTime; // guard

    const totalAnnualCosts = annualPlatform + annualAI + implAnnualized;
    const net = laborSavings - totalAnnualCosts;
    const roiPct = totalAnnualCosts > 0 ? (net / totalAnnualCosts) * 100 : 0;

    return {
      rowHours,
      totalHours,
      fte,
      laborSavings,
      annualPlatform,
      annualAI,
      implAnnualized,
      totalAnnualCosts,
      net,
      roiPct,
    };
  }, [rows, costs]);

  // ------- handlers -------
  const updateRow = (id: string, patch: Partial<Workflow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const removeRow = (id: string) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  const addRow = () =>
    setRows((rs) => [
      ...rs,
      {
        id: crypto.randomUUID(),
        name: "New workflow",
        minutesPerTask: 3,
        tasksPerMonth: 200,
        people: 1,
        automationPct: 50,
        hourlyCost: 40,
      },
    ]);

  // ------- scheduler link with query params -------
  const schedulerLink = (() => {
    const params = new URLSearchParams({
      hours: calc.totalHours.toFixed(1),
      fte: calc.fte.toFixed(2),
      savings: Math.round(calc.laborSavings).toString(),
      costs: Math.round(calc.totalAnnualCosts).toString(),
      roi: Math.round(calc.roiPct).toString(),
    });
    return `https://calendly.com/rick-hancock-rhconsulting/30min?${params.toString()}`;
  })();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
        Agentic Automation ROI
      </h1>
      <p className="mt-2 text-slate-400">
        Estimate time and cost savings from AI agents across your workflows.
      </p>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Hours Saved / yr"
          value={`${num1(calc.totalHours)}`}
          hint={`≈ ${num1(calc.fte)} FTE`}
        />
        <KPI label="FTE Equivalent" value={num1(calc.fte)} />
        <KPI label="Labor Savings / yr" value={money(calc.laborSavings)} />
        <KPI
          label="ROI"
          value={`${Math.round(calc.roiPct)}%`}
          tone={calc.net >= 0 ? "pos" : "neg"}
        />
      </div>

      {/* CTA */}
      <div className="mt-6">
        <a
          href={schedulerLink}
          className="inline-flex items-center rounded-md bg-emerald-500 px-5 py-3 font-medium text-white shadow hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          Book a Call (passes your ROI numbers)
        </a>
      </div>

      {/* Workflows table */}
      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="grid grid-cols-12 gap-3 px-2 pb-2 text-xs uppercase tracking-wide text-slate-400">
          <div className="col-span-3">Workflow</div>
          <div className="col-span-1 text-center">Min/Task</div>
          <div className="col-span-2 text-center">Tasks / Mo</div>
          <div className="col-span-1 text-center">People</div>
          <div className="col-span-2 text-center">Automation %</div>
          <div className="col-span-1 text-center">Hourly $</div>
          <div className="col-span-2 text-right">Annual $ Saved</div>
        </div>

        <div className="space-y-3">
          {rows.map((r, i) => {
            const row = calc.rowHours.find((x) => x.id === r.id);
            const annualSaved = row ? row.dollars : 0;

            return (
              <div
                key={r.id}
                className="grid grid-cols-12 gap-3 items-center rounded-lg bg-slate-900/60 px-2 py-2"
              >
                {/* name */}
                <input
                  className="col-span-3 rounded-md bg-slate-950/60 px-3 py-2 text-slate-100 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={r.name}
                  onChange={(e) => updateRow(r.id, { name: e.target.value })}
                />

                {/* minutesPerTask */}
                <NumberField
                  className="col-span-1"
                  value={r.minutesPerTask}
                  onChange={(val) =>
                    updateRow(r.id, { minutesPerTask: clamp(val, 0, 480) })
                  }
                />

                {/* tasksPerMonth */}
                <NumberField
                  className="col-span-2"
                  value={r.tasksPerMonth}
                  onChange={(val) =>
                    updateRow(r.id, { tasksPerMonth: clamp(val, 0, 1_000_000) })
                  }
                />

                {/* people */}
                <NumberField
                  className="col-span-1"
                  value={r.people}
                  onChange={(val) => updateRow(r.id, { people: clamp(val, 0, 100000) })}
                />

                {/* automationPct */}
                <NumberField
                  className="col-span-2"
                  value={r.automationPct}
                  onChange={(val) =>
                    updateRow(r.id, { automationPct: clamp(val, 0, 100) })
                  }
                />

                {/* hourlyCost */}
                <NumberField
                  className="col-span-1"
                  value={r.hourlyCost}
                  onChange={(val) =>
                    updateRow(r.id, { hourlyCost: clamp(val, 0, 10_000) })
                  }
                />

                {/* annual saved */}
                <div className="col-span-2 text-right font-semibold text-slate-100">
                  {money(annualSaved)}
                </div>

                {/* remove */}
                <button
                  onClick={() => removeRow(r.id)}
                  className="col-span-12 sm:col-span-12 justify-self-end text-sm text-rose-400 hover:text-rose-300"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <button
            onClick={addRow}
            className="rounded-md border border-slate-700 px-3 py-2 text-slate-100 hover:bg-slate-800"
          >
            + Add workflow
          </button>
        </div>
      </section>

      {/* Program costs */}
      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Program costs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <LabeledNumber
            label="Platform cost / mo"
            value={costs.platformPerMonth}
            onChange={(v) =>
              setCosts((c) => ({ ...c, platformPerMonth: clamp(v, 0, 1_000_000) }))
            }
          />
          <LabeledNumber
            label="AI usage / mo"
            value={costs.aiUsagePerMonth}
            onChange={(v) =>
              setCosts((c) => ({ ...c, aiUsagePerMonth: clamp(v, 0, 1_000_000) }))
            }
          />
          <LabeledNumber
            label="Implementation (one-time)"
            value={costs.implementationOneTime}
            onChange={(v) =>
              setCosts((c) => ({
                ...c,
                implementationOneTime: clamp(v, 0, 10_000_000),
              }))
            }
          />
          <LabeledNumber
            label="Amortize over (months)"
            value={costs.amortizeMonths}
            onChange={(v) => setCosts((c) => ({ ...c, amortizeMonths: clamp(v, 1, 120) }))}
          />
        </div>
      </section>
    </div>
  );
}

// ---------- UI bits ----------
function KPI({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "pos" | "neg";
}) {
  const toneClass =
    tone === "pos"
      ? "text-emerald-400"
      : tone === "neg"
      ? "text-rose-400"
      : "text-slate-100";
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

function NumberField({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<string>(String(value));

  // keep input in sync when external value changes (e.g., programmatic changes)
  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      inputMode="decimal"
      className={
        "rounded-md bg-slate-950/60 px-3 py-2 text-slate-100 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center " +
        className
      }
      value={draft}
      onChange={(e) => {
        // Always update the draft so the user can backspace freely
        const v = e.target.value;
        setDraft(v);

        // If it parses to a finite number, push it up immediately
        const n = parseNumLoose(v, NaN);
        if (Number.isFinite(n)) {
          onChange(n as number);
        }
        // If it's empty or mid-typing (e.g., "-"), we just keep draft and wait.
      }}
      onBlur={() => {
        // On blur, normalize: if not a number, snap back to the last good number
        const n = parseNumLoose(draft, value);
        setDraft(String(n));
        onChange(n);
      }}
    />
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <NumberField value={value} onChange={onChange} />
    </label>
  );
}

