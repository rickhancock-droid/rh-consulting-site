"use client";

import * as React from "react";
import Link from "next/link";

const SCHEDULER_URL = "https://calendly.com/rick-hancock-rhconsulting/30min";
const HOURS_PER_FTE = 2080;

const currencyFmt = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);
const num1 = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(isFinite(n) ? n : 0);

/** NumberField: lets you delete the first digit / paste freely.
 *  - Keeps a local string while typing
 *  - Only parses/clamps on blur (or Enter)
 *  - Allows temporarily empty input
 */
type NumberFieldProps = {
  value: number | undefined;
  onChangeNumber: (value: number) => void;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  className?: string;
  placeholder?: string;
};
function NumberField({
  value,
  onChangeNumber,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  allowDecimal = true,
  className = "",
  placeholder,
}: NumberFieldProps) {
  // keep raw text while typing
  const [raw, setRaw] = React.useState<string>(value === 0 || value === undefined ? "" : String(value));

  // only sync down when parent value actually changes (not on every render)
  const prevValueRef = React.useRef<number | undefined>(value);
  React.useEffect(() => {
    if (prevValueRef.current !== value) {
      setRaw(value === 0 || value === undefined ? "" : String(value));
      prevValueRef.current = value;
    }
  }, [value]);

  const parseClamp = (text: string) => {
    const cleaned = (text ?? "").replace(allowDecimal ? /[^\d.]/g : /[^\d]/g, "");
    if (cleaned === "" || cleaned === ".") return undefined; // treat as empty
    const n = Number(cleaned);
    if (!isFinite(n)) return min;
    return Math.max(min, Math.min(n, max));
  };

  return (
    <input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      pattern={allowDecimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none
                  focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20
                  dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 ${className}`}
      value={raw}
      placeholder={placeholder}
      onChange={(e) => setRaw(e.target.value)}                     // free typing
      onBlur={() => {
        const parsed = parseClamp(raw);
        onChangeNumber(parsed === undefined ? min : parsed);       // commit on blur
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur(); // commit on Enter
      }}
    />
  );
}

type TaskRow = {
  id: string;
  name: string;
  minutesPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationRate: number;
  hourlyCost: number;
};

type Costs = {
  monthlyPlatformCost: number;
  monthlyAIUsageCost: number;
  implementationCost: number;
  implementationAmortizationMonths: number;
};

export default function ROIPage() {
  const [rows, setRows] = React.useState<TaskRow[]>([
    { id: rid(), name: "Lead qualification", minutesPerTask: 6, tasksPerMonth: 450, people: 1, automationRate: 60, hourlyCost: 45 },
    { id: rid(), name: "FAQ / info requests", minutesPerTask: 4, tasksPerMonth: 600, people: 1, automationRate: 55, hourlyCost: 40 },
  ]);

  const [costs, setCosts] = React.useState<Costs>({
    monthlyPlatformCost: 300,
    monthlyAIUsageCost: 180,
    implementationCost: 2500,
    implementationAmortizationMonths: 12,
  });

  const updateRowNum = (id: string, field: keyof TaskRow, val: number) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  const updateRowText = (id: string, field: keyof TaskRow, val: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  const addRow = () =>
    setRows((p) => [...p, { id: rid(), name: "New workflow", minutesPerTask: 3, tasksPerMonth: 100, people: 1, automationRate: 50, hourlyCost: 40 }]);
  const delRow = (id: string) => setRows((p) => p.filter((r) => r.id !== id));

  const results = React.useMemo(() => {
    const rowsCalc = rows.map((r) => {
      const minutesSaved = r.minutesPerTask * (r.automationRate / 100);
      const hoursSaved = (minutesSaved * r.tasksPerMonth) / 60;
      const laborSavings = hoursSaved * r.hourlyCost;
      return { ...r, hoursSaved, laborSavings };
    });
    const totalHoursSaved = rowsCalc.reduce((a, b) => a + b.hoursSaved, 0);
    const totalLaborSavings = rowsCalc.reduce((a, b) => a + b.laborSavings, 0);
    const fteSaved = totalHoursSaved / HOURS_PER_FTE;

    const annualPlatformCost = costs.monthlyPlatformCost * 12;
    const annualAIUsageCost = costs.monthlyAIUsageCost * 12;
    const annualizedImplementation =
      (costs.implementationCost / Math.max(1, costs.implementationAmortizationMonths)) * 12;
    const totalAnnualCosts = annualPlatformCost + annualAIUsageCost + annualizedImplementation;

    const netBenefit = totalLaborSavings - totalAnnualCosts;
    const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : Infinity;
    const monthlyNet = totalLaborSavings / 12 - totalAnnualCosts / 12;
    const paybackMonths = monthlyNet > 0 ? costs.implementationCost / monthlyNet : Infinity;

    return {
      rows: rowsCalc,
      totalHoursSaved,
      totalLaborSavings,
      fteSaved,
      annualPlatformCost,
      annualAIUsageCost,
      annualizedImplementation,
      totalAnnualCosts,
      netBenefit,
      roiPct,
      paybackMonths,
    };
  }, [rows, costs]);

  const schedulerHref = React.useMemo(() => {
    const q = new URLSearchParams({
      hours_saved: String(Math.round(results.totalHoursSaved)),
      fte_saved: num1(results.fteSaved),
      savings: String(Math.round(results.totalLaborSavings)),
      costs: String(Math.round(results.totalAnnualCosts)),
      roi_pct: num1(results.roiPct),
      payback_mo: isFinite(results.paybackMonths) ? num1(results.paybackMonths) : "N/A",
      workflows: String(rows.length),
    });
    return `${SCHEDULER_URL}?${q.toString()}`;
  }, [results, rows.length]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold heading">Agentic Automation ROI</h1>
        <p className="muted">Estimate time and cost savings from AI agents across your workflows.</p>
      </header>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Hours saved / yr" value={num1(results.totalHoursSaved)} />
        <SummaryCard label="FTE equivalent" value={num1(results.fteSaved)} />
        <SummaryCard label="Labor savings / yr" value={currencyFmt(results.totalLaborSavings)} />
        <SummaryCard label="ROI" value={`${isFinite(results.roiPct) ? num1(results.roiPct) : "∞"}%`} />
      </div>

      <div className="mb-8">
        <Link href={schedulerHref} className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-5 py-3 text-white hover:bg-brand-primaryDark transition">
          Book a Call (passes your ROI numbers)
        </Link>
      </div>

      {/* Table */}
      <section className="card p-4 mb-8 overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-12 gap-3 px-2 pb-2 text-xs uppercase tracking-wide muted">
            <div className="col-span-3">Workflow</div>
            <div className="col-span-1 text-right">Min/Task</div>
            <div className="col-span-2 text-right">Tasks / Mo</div>
            <div className="col-span-1 text-right">People</div>
            <div className="col-span-2 text-right">Automation %</div>
            <div className="col-span-1 text-right">Hourly $</div>
            <div className="col-span-2 text-right">Annual $ Saved</div>
          </div>

          {results.rows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-3 items-center px-2 py-2 border-t border-slate-200 dark:border-slate-800">
              <div className="col-span-3">
                <input
                  type="text"
                  value={r.name}
                  onChange={(e) => updateRowText(r.id, "name", e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none
                             focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20
                             dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="col-span-1">
                <NumberField value={r.minutesPerTask} onChangeNumber={(v) => updateRowNum(r.id, "minutesPerTask", v)} min={0} />
              </div>
              <div className="col-span-2">
                <NumberField value={r.tasksPerMonth} onChangeNumber={(v) => updateRowNum(r.id, "tasksPerMonth", v)} min={0} allowDecimal={false} />
              </div>
              <div className="col-span-1">
                <NumberField value={r.people} onChangeNumber={(v) => updateRowNum(r.id, "people", v)} min={0} allowDecimal={false} />
              </div>
              <div className="col-span-2">
                <NumberField value={r.automationRate} onChangeNumber={(v) => updateRowNum(r.id, "automationRate", v)} min={0} max={100} />
              </div>
              <div className="col-span-1">
                <NumberField value={r.hourlyCost} onChangeNumber={(v) => updateRowNum(r.id, "hourlyCost", v)} min={0} />
              </div>
              <div className="col-span-2 text-right font-medium">{currencyFmt(r.laborSavings)}</div>
              <div className="col-span-12 flex justify-end">
                <button onClick={() => delRow(r.id)} className="mt-2 text-xs text-red-600 hover:underline">Remove</button>
              </div>
            </div>
          ))}

          <div className="mt-3">
            <button onClick={addRow} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              + Add workflow
            </button>
          </div>
        </div>
      </section>

      {/* Costs */}
      <section className="card p-4 mb-8">
        <h2 className="font-semibold mb-3">Program costs</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <LabeledInput label="Platform cost / mo">
            <NumberField value={costs.monthlyPlatformCost} onChangeNumber={(v) => setCosts((c) => ({ ...c, monthlyPlatformCost: v }))} min={0} />
          </LabeledInput>
          <LabeledInput label="AI usage / mo">
            <NumberField value={costs.monthlyAIUsageCost} onChangeNumber={(v) => setCosts((c) => ({ ...c, monthlyAIUsageCost: v }))} min={0} />
          </LabeledInput>
          <LabeledInput label="Implementation (one-time)">
            <NumberField value={costs.implementationCost} onChangeNumber={(v) => setCosts((c) => ({ ...c, implementationCost: v }))} min={0} />
          </LabeledInput>
          <LabeledInput label="Amortize over (months)">
            <NumberField value={costs.implementationAmortizationMonths} onChangeNumber={(v) => setCosts((c) => ({ ...c, implementationAmortizationMonths: Math.max(1, v) }))} min={1} allowDecimal={false} />
          </LabeledInput>
        </div>
      </section>

      {/* Bottom summary */}
      <section className="card p-5 mb-10">
        <h2 className="font-semibold mb-3">Your estimated impact</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Stat label="Annual labor savings" value={currencyFmt(results.totalLaborSavings)} />
          <Stat label="Annual program costs" value={currencyFmt(results.totalAnnualCosts)} />
          <Stat label="Net benefit (yr)" value={currencyFmt(results.netBenefit)} />
          <Stat label="FTE equivalent" value={num1(results.fteSaved)} />
          <Stat label="ROI" value={`${isFinite(results.roiPct) ? num1(results.roiPct) : "∞"}%`} />
          <Stat label="Payback (months)" value={isFinite(results.paybackMonths) ? num1(results.paybackMonths) : "N/A"} />
        </div>

        <div className="mt-6">
          <Link href={schedulerHref} className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-5 py-3 text-white hover:bg-brand-primaryDark transition">
            Book a Call (passes your ROI numbers)
          </Link>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="muted text-xs uppercase mb-1">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
function LabeledInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm mb-1">{label}</span>
      {children}
    </label>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="muted text-xs uppercase mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
function rid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

