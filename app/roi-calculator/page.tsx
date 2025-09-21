// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useState } from "react";

/* ----------------- constants & helpers ----------------- */
const HOURS_PER_FTE = 2080;
const SCHEDULER = "https://calendly.com/rick-hancock-rhconsulting/30min";

const money = (n: number, c: string = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );
const n1 = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number.isFinite(n) ? n : 0);

/* ----------------- types ----------------- */
type Row = {
  id: string;
  name: string;
  minutesPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0-100
  hourlyCost: number;
};
type Costs = {
  platformMo: number;
  aiMo: number;
  implementationOneTime: number;
  amortizeMonths: number;
};
type CalcRow = Row & { hoursSaved: number; dollarsSaved: number };

/* ----------------- small UI bits ----------------- */
function NumberField({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  className = "",
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
}) {
  // Free typing: allow empty string while editing; coerce on blur
  const [text, setText] = useState<string>(String(value));
  React.useEffect(() => {
    if (String(value) !== text) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const n = Number(t);
        if (!Number.isNaN(n)) onChange(n);
      }}
      onBlur={() => {
        let n = Number(text);
        if (Number.isNaN(n)) n = value;
        if (max !== undefined) n = Math.min(n, max);
        if (min !== undefined) n = Math.max(n, min);
        setText(String(n));
        onChange(n);
      }}
      className={
        "w-full rounded-xl border bg-white/60 px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition placeholder:text-slate-400 " +
        "focus:ring-2 focus:ring-violet-500 dark:bg-slate-900/40 dark:text-slate-100 dark:ring-slate-700 dark:focus:ring-violet-400 " +
        className
      }
      min={min}
      max={max}
      step={step}
    />
  );
}

/* ----------------- workflow templates ----------------- */
const WORKFLOW_TEMPLATES: Omit<Row, "id">[] = [
  { name: "Lead qualification", minutesPerTask: 6, tasksPerMonth: 100, people: 10, automationPct: 60, hourlyCost: 45 },
  { name: "FAQ / info requests", minutesPerTask: 4, tasksPerMonth: 600, people: 1, automationPct: 55, hourlyCost: 40 },
  { name: "Inbound email triage", minutesPerTask: 5, tasksPerMonth: 1200, people: 2, automationPct: 65, hourlyCost: 40 },
  { name: "CRM data entry", minutesPerTask: 3, tasksPerMonth: 1600, people: 2, automationPct: 70, hourlyCost: 40 },
];

/* ----------------- page ----------------- */
export default function ROIPage() {
  // defaults mirror ~100-employee SMB
  const [adoptionPct, setAdoptionPct] = useState<number>(80);
  const [costs, setCosts] = useState<Costs>({
    platformMo: 300,
    aiMo: 180,
    implementationOneTime: 2500,
    amortizeMonths: 12,
  });

  const [rows, setRows] = useState<Row[]>([
    { id: cryptoRandom(), ...WORKFLOW_TEMPLATES[0] },
    { id: cryptoRandom(), ...WORKFLOW_TEMPLATES[1] },
  ]);

  const addTemplate = (idx: number) => {
    const tpl = WORKFLOW_TEMPLATES[idx];
    if (!tpl) return;
    setRows((r) => [{ id: cryptoRandom(), ...tpl }, ...r]);
  };

  const results = useMemo(() => {
    const adoption = adoptionPct / 100;

    const rowsWithCalc: CalcRow[] = rows.map((r) => {
      const hours =
        (r.minutesPerTask / 60) *
        r.tasksPerMonth *
        12 *
        r.people *
        (r.automationPct / 100) *
        adoption;
      const dollars = hours * r.hourlyCost;
      return { ...r, hoursSaved: hours, dollarsSaved: dollars };
    });

    const totalHours = rowsWithCalc.reduce((s, r) => s + r.hoursSaved, 0);
    const fte = totalHours / HOURS_PER_FTE;
    const labor$ = rowsWithCalc.reduce((s, r) => s + r.dollarsSaved, 0);

    const annualPlatform = costs.platformMo * 12;
    const annualAI = costs.aiMo * 12;
    const annualizedImpl =
      costs.amortizeMonths > 0 ? (costs.implementationOneTime / costs.amortizeMonths) * 12 : 0;
    const annualCosts = annualPlatform + annualAI + annualizedImpl;

    const net = labor$ - annualCosts;
    const roiPct = annualCosts > 0 ? (net / annualCosts) * 100 : 0;

    return { rows: rowsWithCalc, totalHours, fte, labor$, annualCosts, net, roiPct };
  }, [rows, adoptionPct, costs]);

  const calendlyHref = new URL(SCHEDULER);
  calendlyHref.searchParams.set("hours", Math.round(results.totalHours).toString());
  calendlyHref.searchParams.set("fte", n1(results.fte));
  calendlyHref.searchParams.set("labor", Math.round(results.labor$).toString());
  calendlyHref.searchParams.set("costs", Math.round(results.annualCosts).toString());
  calendlyHref.searchParams.set("net", Math.round(results.net).toString());
  calendlyHref.searchParams.set("roi", Math.round(results.roiPct).toString());

  return (
    <div className="mx-auto max-w-6xl px-4 pb-14 pt-6">
      {/* top bar: title/strap + action & KPI */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AI ROI Calculators
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Estimate time &amp; cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>

        {/* action + KPI card */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <a
            href={calendlyHref.toString()}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Book a Call (passes your ROI)
          </a>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">ROI</div>
            <div className="text-lg font-semibold text-emerald-500">{Math.round(results.roiPct)}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{money(results.net)} net</div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Hours saved / yr" value={`${n1(results.totalHours)} hrs`} sub={`≈ ${n1(results.fte)} FTE`} />
        <KPI label="FTE equivalent" value={n1(results.fte)} sub={`based on ${HOURS_PER_FTE} hrs/yr`} />
        <KPI label="Labor savings / yr" value={money(results.labor$)} />
        <KPI label="ROI" value={`${Math.round(results.roiPct)}%`} sub={`${money(results.net)} net`} accent />
      </div>

      {/* program controls */}
      <div className="mb-5 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-1 lg:col-span-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Adoption rate (%)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={adoptionPct}
            onChange={(e) => setAdoptionPct(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{adoptionPct}% of eligible work</div>
        </div>

        <Field label="Platform cost / mo">
          <NumberField value={costs.platformMo} onChange={(v) => setCosts({ ...costs, platformMo: v })} />
        </Field>
        <Field label="AI usage / mo">
          <NumberField value={costs.aiMo} onChange={(v) => setCosts({ ...costs, aiMo: v })} />
        </Field>
        <Field label="Implementation (one-time)">
          <NumberField
            value={costs.implementationOneTime}
            onChange={(v) => setCosts({ ...costs, implementationOneTime: v })}
          />
        </Field>
        <Field label="Amortize (months)">
          <NumberField value={costs.amortizeMonths} onChange={(v) => setCosts({ ...costs, amortizeMonths: v })} />
        </Field>
      </div>

      {/* workflows */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* add from template */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Add workflow:</label>
          <select
            className="rounded-lg border bg-white/60 px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:ring-slate-700"
            defaultValue=""
            onChange={(e) => {
              const idx = Number(e.target.value);
              if (!Number.isNaN(idx)) addTemplate(idx);
              e.currentTarget.value = "";
            }}
          >
            <option value="" disabled>
              Choose a template…
            </option>
            {WORKFLOW_TEMPLATES.map((t, i) => (
              <option key={t.name + i} value={i}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* table header */}
        <div className="grid grid-cols-12 gap-3 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <div className="col-span-3">Workflow</div>
          <div className="col-span-1">Min/Task</div>
          <div className="col-span-2">Tasks / mo</div>
          <div className="col-span-1">People</div>
          <div className="col-span-2">Automation %</div>
          <div className="col-span-1">Hourly $</div>
          <div className="col-span-2 text-right">Annual $ saved</div>
        </div>

        {/* rows */}
        <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {results.rows.map((r: CalcRow) => (
            <div key={r.id} className="grid grid-cols-12 items-center gap-3 py-3">
              <div className="col-span-3">
                <input
                  value={r.name}
                  onChange={(e) => edit(r.id, { name: e.target.value }, setRows)}
                  className="w-full rounded-xl border bg-white/60 px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:ring-slate-700"
                />
              </div>
              <div className="col-span-1">
                <NumberField
                  value={r.minutesPerTask}
                  onChange={(v) => edit(r.id, { minutesPerTask: clamp(v, 0, 1000) }, setRows)}
                />
              </div>
              <div className="col-span-2">
                <NumberField
                  value={r.tasksPerMonth}
                  onChange={(v) => edit(r.id, { tasksPerMonth: clamp(v, 0, 100000) }, setRows)}
                />
              </div>
              <div className="col-span-1">
                <NumberField value={r.people} onChange={(v) => edit(r.id, { people: clamp(v, 0, 100000) }, setRows)} />
              </div>
              <div className="col-span-2">
                <NumberField
                  value={r.automationPct}
                  onChange={(v) => edit(r.id, { automationPct: clamp(v, 0, 100) }, setRows)}
                />
              </div>
              <div className="col-span-1">
                <NumberField
                  value={r.hourlyCost}
                  onChange={(v) => edit(r.id, { hourlyCost: clamp(v, 0, 10000) }, setRows)}
                />
              </div>
              <div className="col-span-2 text-right text-slate-900 dark:text-slate-100 font-medium">
                {money(r.dollarsSaved)}
              </div>
              <div className="col-span-12 mt-2 flex justify-end">
                <button
                  onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                  className="text-sm text-rose-500 hover:text-rose-400"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-right text-sm text-slate-500 dark:text-slate-400">
          Total annual costs: {money(results.annualCosts)}
        </div>
      </div>

      {/* bottom summary cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Annual hours saved" value={`${n1(results.totalHours)} hrs`} />
        <KPI label="Annual labor savings" value={money(results.labor$)} sub="before software costs" />
        <KPI label="Total annual costs" value={money(results.annualCosts)} sub="platform + usage + build" />
        <KPI label="Net benefit / ROI" value={money(results.net)} sub={`${Math.round(results.roiPct)}% ROI`} accent />
      </div>

      {/* explainer (closed by default) */}
      <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer text-base font-semibold text-slate-900 hover:opacity-90 dark:text-slate-100">
          How we calculate ROI
        </summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>
            <strong>Hours saved / workflow</strong> = minutes per task × tasks/mo × people × automation% × adoption% ×
            12 months.
          </li>
          <li>
            <strong>Annual $ saved</strong> = hours saved × hourly cost (loaded).
          </li>
          <li>
            <strong>Total annual costs</strong> = (platform/mo + AI usage/mo) × 12 + (implementation ÷ amortize months)
            × 12.
          </li>
          <li>
            <strong>Net benefit</strong> = annual labor savings – total annual costs.
          </li>
          <li>
            <strong>ROI %</strong> = net benefit ÷ total annual costs.
          </li>
        </ul>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Defaults mirror a typical ~100-employee SMB. Tune adoption and automation% to your reality. We can also model
          license consolidation or additional headcount lift on a live call.
        </p>
      </details>
    </div>
  );
}

/* ----------------- utility pieces ----------------- */
function KPI({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border p-4 shadow-sm " +
        (accent
          ? "border-amber-300 bg-amber-50/80 dark:border-amber-500/40 dark:bg-amber-500/5"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900")
      }
    >
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
      {sub ? <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function edit(id: string, patch: Partial<Row>, set: React.Dispatch<React.SetStateAction<Row[]>>) {
  set((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : 0));
}
function cryptoRandom(): string {
  // Prefer Web Crypto randomUUID when available without using `any`
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g && g.crypto && typeof g.crypto.randomUUID === "function") return g.crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

