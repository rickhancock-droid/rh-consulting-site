"use client";
import React, { useMemo, useState } from "react";

// ---------- Helpers ----------
const fmtMoney = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);
const fmt1 = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(isFinite(n) ? n : 0);
const HOURS_PER_FTE = 2080;
const SCHEDULER_URL = "https://calendly.com/rick-hancock-rhconsulting/30min"; // replace if needed

type Row = {
  id: string;
  name: string;
  minutesPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationRate: number; // 0-100
  hourlyCost: number;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// CSV export
function exportCSV(rows: Row[]) {
  const headers = [
    "Task/Workflow",
    "Minutes per Task",
    "Tasks per Month",
    "People",
    "Automation %",
    "Hourly Cost",
    "Hours Saved / yr",
    "Labor Savings / yr",
  ].join(",");

  const lines = rows.map((r) => {
    const hoursSavedYr = ((r.minutesPerTask / 60) * r.tasksPerMonth * 12 * (r.automationRate / 100)) / Math.max(1, r.people);
    const labor = hoursSavedYr * r.hourlyCost;
    return [
      wrap(r.name),
      r.minutesPerTask,
      r.tasksPerMonth,
      r.people,
      r.automationRate,
      r.hourlyCost,
      hoursSavedYr.toFixed(1),
      Math.round(labor),
    ].join(",");
  });

  const blob = new Blob([headers + "\n" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "automation-roi.csv";
  a.click();
  URL.revokeObjectURL(url);
}
const wrap = (s: string) => `"${String(s).replaceAll('"', '""')}"`;

// ---------- Page ----------
export default function ROIPage() {
  // Global costs
  const [adoptionPct, setAdoptionPct] = useState(80); // % of eligible work that uses agents
  const [monthlyPlatformCost, setMonthlyPlatformCost] = useState(300);
  const [monthlyAIUsageCost, setMonthlyAIUsageCost] = useState(150);
  const [implementationCost, setImplementationCost] = useState(2500);
  const [implementationAmortizationMonths, setImplementationAmortizationMonths] = useState(12);

  const [rows, setRows] = useState<Row[]>([
    { id: uid(), name: "Inbound email", minutesPerTask: 5, tasksPerMonth: 1200, people: 2, automationRate: 60, hourlyCost: 40 },
    { id: uid(), name: "CRM data entry", minutesPerTask: 3, tasksPerMonth: 1600, people: 2, automationRate: 70, hourlyCost: 40 },
  ]);

  function addRow() {
    setRows((r) => [
      ...r,
      { id: uid(), name: "New workflow", minutesPerTask: 5, tasksPerMonth: 500, people: 1, automationRate: 60, hourlyCost: 40 },
    ]);
  }
  function removeRow(id: string) {
    setRows((r) => r.filter((x) => x.id !== id));
  }
  function updateRow(id: string, patch: Partial<Row>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  // Calculations
  const calc = useMemo(() => {
    const adjusted = rows.map((r) => ({
      ...r,
      hoursSavedYr:
        ((r.minutesPerTask / 60) * r.tasksPerMonth * 12 * (r.automationRate / 100) * (adoptionPct / 100)) /
        Math.max(1, r.people),
    }));

    const totalHoursSaved = adjusted.reduce((s, r) => s + r.hoursSavedYr, 0);
    const totalLaborSavings = adjusted.reduce((s, r) => s + r.hoursSavedYr * r.hourlyCost, 0);
    const fteSaved = totalHoursSaved / HOURS_PER_FTE;

    const annualPlatform = monthlyPlatformCost * 12;
    const annualUsage = monthlyAIUsageCost * 12;
    const annualizedImpl =
      implementationAmortizationMonths > 0 ? (implementationCost * 12) / implementationAmortizationMonths : implementationCost;

    const totalAnnualCosts = annualPlatform + annualUsage + annualizedImpl;
    const netBenefit = totalLaborSavings - totalAnnualCosts;
    const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : Infinity;
    const paybackMonths =
      totalLaborSavings > 0 ? (implementationCost / (totalLaborSavings / 12 || Infinity)) : Infinity;

    return {
      rows: adjusted,
      totalHoursSaved,
      totalLaborSavings,
      fteSaved,
      annualPlatform,
      annualUsage,
      annualizedImpl,
      totalAnnualCosts,
      netBenefit,
      roiPct,
      paybackMonths,
    };
  }, [
    rows,
    monthlyPlatformCost,
    monthlyAIUsageCost,
    implementationCost,
    implementationAmortizationMonths,
    adoptionPct,
  ]);

  // Dynamic Calendly link with ROI params
  const schedulerURL = useMemo(() => {
    const params = new URLSearchParams({
      hs: Math.round(calc.totalHoursSaved).toString(),
      ls: Math.round(calc.totalLaborSavings).toString(),
      cost: Math.round(calc.totalAnnualCosts).toString(),
      nb: Math.round(calc.netBenefit).toString(),
      roi: Math.round(calc.roiPct).toString(),
      fte: fmt1(calc.fteSaved),
    });
    return `${SCHEDULER_URL}?${params.toString()}`;
  }, [calc]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 text-brand-ink dark:text-slate-100">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-semibold heading">AI ROI Calculators</h1>
      <p className="mt-2 muted">Run scenarios for Automation or Support. Book a call with your results pre-filled.</p>

      {/* Global cost controls */}
      <div className="card p-4 md:p-5 mt-6">
        <div className="grid md:grid-cols-4 gap-3">
          {/* Adoption */}
          <div>
            <label className="block text-xs font-medium muted">Adoption Rate (%)</label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={adoptionPct}
              onChange={(e) => setAdoptionPct(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs muted mt-1">{adoptionPct}% of eligible work uses agents</div>
          </div>

          <div>
            <label className="block text-xs font-medium muted">Monthly Platform Cost</label>
            <input
              type="number"
              className="field w-full"
              value={monthlyPlatformCost}
              onChange={(e) => setMonthlyPlatformCost(Number(e.target.value))}
            />
            <div className="text-xs muted mt-1">Subscriptions/tools</div>
          </div>

          <div>
            <label className="block text-xs font-medium muted">Monthly AI Usage Cost</label>
            <input
              type="number"
              className="field w-full"
              value={monthlyAIUsageCost}
              onChange={(e) => setMonthlyAIUsageCost(Number(e.target.value))}
            />
            <div className="text-xs muted mt-1">Model/API spend</div>
          </div>

          <div>
            <label className="block text-xs font-medium muted">Implementation (one-time)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="field w-full"
                value={implementationCost}
                onChange={(e) => setImplementationCost(Number(e.target.value))}
              />
              <input
                type="number"
                className="field w-full"
                value={implementationAmortizationMonths}
                onChange={(e) => setImplementationAmortizationMonths(Number(e.target.value))}
              />
            </div>
            <div className="text-xs muted mt-1">Spread cost over N months</div>
          </div>
        </div>
      </div>

      {/* Workflows */}
      <div className="flex items-center gap-3 mt-6">
        <button onClick={addRow} className="chip">+ Add Workflow</button>
        <button onClick={() => exportCSV(rows)} className="chip">Export CSV</button>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-8 gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium uppercase muted">Task / Workflow</div>
            <div className="text-xs font-medium uppercase muted">Min / Task</div>
            <div className="text-xs font-medium uppercase muted">Tasks / Month</div>
            <div className="text-xs font-medium uppercase muted">People</div>
            <div className="text-xs font-medium uppercase muted">Automation %</div>
            <div className="text-xs font-medium uppercase muted">Hourly Cost</div>
            <div className="text-xs font-medium uppercase muted">Hours Saved / yr</div>
            <div className="text-xs font-medium uppercase muted">Action</div>
          </div>

          {rows.map((r) => {
            const hoursSaved =
              ((r.minutesPerTask / 60) * r.tasksPerMonth * 12 * (r.automationRate / 100) *  (adoptionPct / 100)) /
              Math.max(1, r.people);

            return (
              <div key={r.id} className="grid grid-cols-8 gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <input className="field w-full" value={r.name} onChange={(e) => updateRow(r.id, { name: e.target.value })} />
                <input
                  type="number"
                  className="field w-full"
                  value={r.minutesPerTask}
                  onChange={(e) => updateRow(r.id, { minutesPerTask: Number(e.target.value) })}
                />
                <input
                  type="number"
                  className="field w-full"
                  value={r.tasksPerMonth}
                  onChange={(e) => updateRow(r.id, { tasksPerMonth: Number(e.target.value) })}
                />
                <input
                  type="number"
                  className="field w-full"
                  value={r.people}
                  onChange={(e) => updateRow(r.id, { people: Number(e.target.value) })}
                />
                <input
                  type="number"
                  className="field w-full"
                  value={r.automationRate}
                  onChange={(e) => updateRow(r.id, { automationRate: Number(e.target.value) })}
                />
                <input
                  type="number"
                  className="field w-full"
                  value={r.hourlyCost}
                  onChange={(e) => updateRow(r.id, { hourlyCost: Number(e.target.value) })}
                />
                <div className="h-10 flex items-center">{fmt1(hoursSaved)} hrs</div>
                <button onClick={() => removeRow(r.id)} className="chip">Remove</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid md:grid-cols-4 gap-4 mt-6">
        <div className="card p-6">
          <div className="text-xs uppercase tracking-wide muted">Annual Hours Saved</div>
          <div className="mt-2 text-3xl font-semibold heading">{fmt1(calc.totalHoursSaved)}</div>
          <div className="mt-1 text-xs muted">≈ {fmt1(calc.fteSaved)} FTE</div>
        </div>

        <div className="card p-6">
          <div className="text-xs uppercase tracking-wide muted">Annual Labor Savings</div>
          <div className="mt-2 text-3xl font-semibold heading">{fmtMoney(calc.totalLaborSavings)}</div>
          <div className="mt-1 text-xs muted">before software costs</div>
        </div>

        <div className="card p-6">
          <div className="text-xs uppercase tracking-wide muted">Total Annual Costs</div>
          <div className="mt-2 text-3xl font-semibold heading">{fmtMoney(calc.totalAnnualCosts)}</div>
          <div className="mt-1 text-xs muted">platform + usage + build</div>
        </div>

        <div className="card p-6">
          <div className="text-xs uppercase tracking-wide muted">Net Benefit / ROI</div>
          <div className={`mt-2 text-3xl font-semibold ${calc.netBenefit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {fmtMoney(calc.netBenefit)}
          </div>
          <div className={`mt-1 text-xs ${calc.netBenefit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {isFinite(calc.roiPct) ? `${Math.round(calc.roiPct)}% ROI` : "—"}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6">
        <a
          href={schedulerURL}
          className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-brand-accent hover:bg-brand-accentDark
                     text-white shadow-card focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-brand-accent dark:focus:ring-offset-slate-950">
          Book a Call with These Results
        </a>
      </div>
    </section>
  );
}

