// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

/* ---------- Visual accent (tweak this to your brand orange) ---------- */
const ACCENT_HEX = "#FF6A00"; // logo-like orange
const HOURS_PER_FTE = 2080;
const SCHEDULER_URL =
  "https://calendly.com/rick-hancock-rhconsulting/30min";

/* ---------- Helpers ---------- */
const fmtMoney = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(isFinite(n) ? n : 0);

const fmt1 = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    isFinite(n) ? n : 0
  );

function buildURL(base: string, params: Record<string, string | number>) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => qp.set(k, String(v)));
  return `${base}?${qp.toString()}`;
}

/* ---------- Types ---------- */
type Row = {
  id: string;
  name: string;
  minutesPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number;
  hourlyCost: number;
};

type Costs = {
  platformMonthly: number;
  aiMonthly: number;
  implementation: number;
  amortizeMonths: number;
};

/* ---------- Workflow presets (inspired by common Salesforce-style calculators) ---------- */
const WORKFLOW_PRESETS: Record<
  string,
  Omit<Row, "id" | "name"> & { label: string }
> = {
  lead_qual: {
    label: "Lead qualification",
    minutesPerTask: 6,
    tasksPerMonth: 100,
    people: 10,
    automationPct: 60,
    hourlyCost: 45,
  },
  faq: {
    label: "FAQ / info requests",
    minutesPerTask: 4,
    tasksPerMonth: 600,
    people: 1,
    automationPct: 55,
    hourlyCost: 40,
  },
  support_tickets: {
    label: "Support tickets (tier-1)",
    minutesPerTask: 7,
    tasksPerMonth: 800,
    people: 3,
    automationPct: 60,
    hourlyCost: 38,
  },
  crm_data: {
    label: "CRM data entry",
    minutesPerTask: 3,
    tasksPerMonth: 1600,
    people: 2,
    automationPct: 70,
    hourlyCost: 40,
  },
  ap_invoices: {
    label: "AP / invoice processing",
    minutesPerTask: 10,
    tasksPerMonth: 400,
    people: 2,
    automationPct: 50,
    hourlyCost: 42,
  },
};

/* ---------- NumberField (free typing + backspace works) ---------- */
function NumberField({
  value,
  onChange,
  className = "",
  min,
  max,
  placeholder,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [raw, setRaw] = useState(String(value ?? ""));
  React.useEffect(() => setRaw(String(value ?? "")), [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      placeholder={placeholder}
      aria-label={ariaLabel || placeholder}
      onChange={(e) => {
        const next = e.target.value;
        setRaw(next);
        const normalized = next.replace(/[^\d.\-]/g, "");
        const parsed =
          normalized === "" || normalized === "-" ? NaN : Number(normalized);
        if (!Number.isNaN(parsed)) {
          let v = parsed;
          if (min != null) v = Math.max(min, v);
          if (max != null) v = Math.min(max, v);
          onChange(v);
        }
      }}
      onBlur={() => setRaw(String(value ?? ""))}
      className={[
        "w-full h-10 rounded-xl border px-3",
        "bg-white text-slate-900 border-slate-300",
        "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
        "outline-none focus:ring-2 focus:ring-indigo-500/50",
        className,
      ].join(" ")}
    />
  );
}

/* ---------- Defaults (100-employee SMB) ---------- */
const DEFAULT_ROWS: Row[] = [
  {
    id: "lead-qual",
    name: WORKFLOW_PRESETS.lead_qual.label,
    minutesPerTask: WORKFLOW_PRESETS.lead_qual.minutesPerTask,
    tasksPerMonth: WORKFLOW_PRESETS.lead_qual.tasksPerMonth,
    people: WORKFLOW_PRESETS.lead_qual.people,
    automationPct: WORKFLOW_PRESETS.lead_qual.automationPct,
    hourlyCost: WORKFLOW_PRESETS.lead_qual.hourlyCost,
  },
  {
    id: "faq",
    name: WORKFLOW_PRESETS.faq.label,
    minutesPerTask: WORKFLOW_PRESETS.faq.minutesPerTask,
    tasksPerMonth: WORKFLOW_PRESETS.faq.tasksPerMonth,
    people: WORKFLOW_PRESETS.faq.people,
    automationPct: WORKFLOW_PRESETS.faq.automationPct,
    hourlyCost: WORKFLOW_PRESETS.faq.hourlyCost,
  },
];

const DEFAULT_COSTS: Costs = {
  platformMonthly: 300,
  aiMonthly: 180,
  implementation: 2500,
  amortizeMonths: 12,
};

/* ====================================================================== */

export default function ROICalculatorPage() {
  const [adoption, setAdoption] = useState<number>(80);
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [costs, setCosts] = useState<Costs>(DEFAULT_COSTS);
  const [showExplainer, setShowExplainer] = useState<boolean>(false); // collapsed by default

  /* ---------- Math ---------- */
  const results = useMemo(() => {
    const adoptionRate = adoption / 100;

    const rowsWithCalc = rows.map((r) => {
      const hours =
        (r.minutesPerTask / 60) *
        r.tasksPerMonth *
        12 *
        r.people *
        (r.automationPct / 100) *
        adoptionRate;
      const dollars = hours * r.hourlyCost;
      return { ...r, hoursSaved: hours, dollarsSaved: dollars };
    });

    const totalHours = rowsWithCalc.reduce((s, r) => s + r.hoursSaved, 0);
    const fte = totalHours / HOURS_PER_FTE;
    const labor$ = rowsWithCalc.reduce((s, r) => s + r.dollarsSaved, 0);

    const annualPlatform = costs.platformMonthly * 12;
    const annualAI = costs.aiMonthly * 12;
    const annualImpl =
      costs.amortizeMonths > 0
        ? costs.implementation / costs.amortizeMonths
        : costs.implementation;

    const annualCosts = annualPlatform + annualAI + annualImpl;
    const net = labor$ - annualCosts;
    const roiPct = annualCosts > 0 ? (net / annualCosts) * 100 : Infinity;

    return {
      rows: rowsWithCalc,
      totalHours,
      fte,
      labor$,
      annualCosts,
      net,
      roiPct,
    };
  }, [rows, adoption, costs]);

  const calendlyHref = buildURL(SCHEDULER_URL, {
    hours: Math.round(results.totalHours),
    fte: results.fte.toFixed(1),
    savings: Math.round(results.labor$),
    costs: Math.round(results.annualCosts),
    net: Math.round(results.net),
    roi: Math.round(results.roiPct),
  });

  /* ---------- Reusable styles ---------- */
  const card =
    "rounded-2xl border bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800";
  const cardMuted = card + " text-sm";
  const gridLabel =
    "text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400";

  /* ---------- UI ---------- */
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* Title + CTA (single line on md+) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-left">
          <h1 className="text-2xl font-bold leading-tight">AI ROI Calculators</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Estimate time &amp; cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>
        <Link
          href={calendlyHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 shadow transition-colors self-start md:self-auto"
        >
          Book a Call (passes your ROI)
        </Link>
      </div>

      {/* Dashboard stats with orange accent */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          {
            label: "Hours saved / yr",
            main: `${fmt1(results.totalHours)}`,
            sub: `≈ ${fmt1(results.fte)} FTE`,
          },
          { label: "FTE equivalent", main: fmt1(results.fte), sub: "based on 2080 hrs/yr" },
          { label: "Labor savings / yr", main: fmtMoney(results.labor$) },
          {
            label: "Net benefit / ROI",
            main: `${fmtMoney(results.net)}${
              isFinite(results.roiPct) ? ` (${Math.round(results.roiPct)}%)` : ""
            }`,
          },
        ].map((c, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 text-white"
            style={{ background: ACCENT_HEX }}
          >
            <div className="text-[11px] uppercase tracking-wide opacity-90">
              {c.label}
            </div>
            <div className="text-xl font-semibold mt-0.5">{c.main}</div>
            {c.sub && <div className="opacity-90 text-xs">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Controls (compact) */}
      <div className={card + " p-4 space-y-4"}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Adoption slider */}
          <div>
            <div className={gridLabel}>Adoption rate (%)</div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={adoption}
              onChange={(e) => setAdoption(Number(e.target.value))}
              className="w-full accent-indigo-500"
              aria-label="Adoption rate"
            />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {adoption}% of eligible work
            </div>
          </div>

          <div>
            <div className={gridLabel}>Platform cost / mo</div>
            <NumberField
              value={costs.platformMonthly}
              onChange={(v) => setCosts((c) => ({ ...c, platformMonthly: v }))}
              placeholder="300"
            />
          </div>

          <div>
            <div className={gridLabel}>AI usage / mo</div>
            <NumberField
              value={costs.aiMonthly}
              onChange={(v) => setCosts((c) => ({ ...c, aiMonthly: v }))}
              placeholder="180"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={gridLabel}>Implementation (one-time)</div>
              <NumberField
                value={costs.implementation}
                onChange={(v) => setCosts((c) => ({ ...c, implementation: v }))}
                placeholder="2500"
              />
            </div>
            <div>
              <div className={gridLabel}>Amortize (months)</div>
              <NumberField
                value={costs.amortizeMonths}
                onChange={(v) =>
                  setCosts((c) => ({ ...c, amortizeMonths: Math.max(1, Math.round(v)) }))
                }
                placeholder="12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Workflows (with Preset dropdown) */}
      <div className={card + " p-4 space-y-3"}>
        <div className="grid grid-cols-12 gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <div className="col-span-4">Workflow / Preset</div>
          <div>Min/Task</div>
          <div>Tasks / mo</div>
          <div>People</div>
          <div>Automation %</div>
          <div>Hourly $</div>
          <div className="col-span-2 text-right">Annual $ saved</div>
          <div className="col-span-1"></div>
        </div>

        {results.rows.map((r, idx) => (
          <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4 grid grid-cols-12 gap-2">
              {/* Name input */}
              <input
                type="text"
                value={r.name}
                onChange={(e) =>
                  setRows((rows) => {
                    const copy = [...rows];
                    copy[idx] = { ...rows[idx], name: e.target.value };
                    return copy;
                  })
                }
                className={[
                  "col-span-7 h-10 rounded-xl border px-3",
                  "bg-white text-slate-900 border-slate-300",
                  "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                  "outline-none focus:ring-2 focus:ring-indigo-500/50",
                ].join(" ")}
              />

              {/* Preset dropdown */}
              <select
                className={[
                  "col-span-5 h-10 rounded-xl border px-2",
                  "bg-white text-slate-900 border-slate-300",
                  "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                  "outline-none focus:ring-2 focus:ring-indigo-500/50",
                ].join(" ")}
                value=""
                onChange={(e) => {
                  const key = e.target.value as keyof typeof WORKFLOW_PRESETS;
                  if (!key) return;
                  const p = WORKFLOW_PRESETS[key];
                  setRows((rows) => {
                    const copy = [...rows];
                    copy[idx] = {
                      ...rows[idx],
                      name: p.label,
                      minutesPerTask: p.minutesPerTask,
                      tasksPerMonth: p.tasksPerMonth,
                      people: p.people,
                      automationPct: p.automationPct,
                      hourlyCost: p.hourlyCost,
                    };
                    return copy;
                  });
                }}
              >
                <option value="">Preset…</option>
                {Object.entries(WORKFLOW_PRESETS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <NumberField
              value={r.minutesPerTask}
              onChange={(v) =>
                setRows((rows) => {
                  const copy = [...rows];
                  copy[idx] = { ...rows[idx], minutesPerTask: v };
                  return copy;
                })
              }
              placeholder="6"
              ariaLabel="Minutes per task"
            />
            <NumberField
              value={r.tasksPerMonth}
              onChange={(v) =>
                setRows((rows) => {
                  const copy = [...rows];
                  copy[idx] = { ...rows[idx], tasksPerMonth: v };
                  return copy;
                })
              }
              placeholder="100"
              ariaLabel="Tasks per month"
            />
            <NumberField
              value={r.people}
              onChange={(v) =>
                setRows((rows) => {
                  const copy = [...rows];
                  copy[idx] = { ...rows[idx], people: v };
                  return copy;
                })
              }
              placeholder="10"
              ariaLabel="People"
            />
            <NumberField
              value={r.automationPct}
              onChange={(v) =>
                setRows((rows) => {
                  const copy = [...rows];
                  copy[idx] = {
                    ...rows[idx],
                    automationPct: Math.max(0, Math.min(100, v)),
                  };
                  return copy;
                })
              }
              placeholder="60"
              ariaLabel="Automation %"
            />
            <NumberField
              value={r.hourlyCost}
              onChange={(v) =>
                setRows((rows) => {
                  const copy = [...rows];
                  copy[idx] = { ...rows[idx], hourlyCost: v };
                  return copy;
                })
              }
              placeholder="45"
              ariaLabel="Hourly cost"
            />

            <div className="col-span-2 text-right text-slate-900 dark:text-slate-100 font-medium">
              {fmtMoney((r as any).dollarsSaved)}
            </div>

            <div className="col-span-1 text-right">
              <button
                className="text-rose-500 hover:text-rose-400"
                onClick={() =>
                  setRows((rows) => rows.filter((x) => x.id !== r.id))
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div>
          <button
            className="rounded-xl px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
            onClick={() =>
              setRows((rows) => [
                ...rows,
                {
                  id: Math.random().toString(36).slice(2),
                  name: "New workflow",
                  minutesPerTask: 5,
                  tasksPerMonth: 100,
                  people: 1,
                  automationPct: 50,
                  hourlyCost: 40,
                },
              ])
            }
          >
            + Add workflow
          </button>
        </div>

        <div className="text-right text-sm text-slate-500 dark:text-slate-400">
          Total annual costs: {fmtMoney(results.annualCosts)}
        </div>
      </div>

      {/* Bottom summary — costs only (no duplicate ROI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={cardMuted + " p-4"}>
          <div className={gridLabel}>Annual hours saved</div>
          <div className="text-xl font-semibold mt-0.5">
            {fmt1(results.totalHours)} hrs
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-xs">
            ≈ {fmt1(results.fte)} FTE
          </div>
        </div>
        <div className={cardMuted + " p-4"}>
          <div className={gridLabel}>Annual labor savings</div>
          <div className="text-xl font-semibold mt-0.5">
            {fmtMoney(results.labor$)}
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-xs">
            before software costs
          </div>
        </div>
        <div className={cardMuted + " p-4"}>
          <div className={gridLabel}>Total annual costs</div>
          <div className="text-xl font-semibold mt-0.5">
            {fmtMoney(results.annualCosts)}
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-xs">
            platform + usage + build
          </div>
        </div>
      </div>

      {/* Explainer (collapsed by default) */}
      <div className={card + " p-0 overflow-hidden"}>
        <button
          className="w-full text-left px-4 py-3 flex items-center gap-2"
          onClick={() => setShowExplainer((s) => !s)}
        >
          <span className="text-slate-900 dark:text-slate-50 text-sm">
            {showExplainer ? "▾" : "▸"} How we calculate ROI
          </span>
        </button>
        {showExplainer && (
          <div className="px-4 pb-4">
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
              <ul>
                <li>
                  <strong>Hours saved / workflow</strong> = minutes per task ×
                  tasks/mo × people × automation% × adoption% × 12 months.
                </li>
                <li>
                  <strong>Annual $ saved</strong> = hours saved × hourly cost
                  (loaded).
                </li>
                <li>
                  <strong>Total annual costs</strong> = (platform/mo + AI
                  usage/mo) × 12 + (implementation ÷ amortize months).
                </li>
                <li>
                  <strong>Net benefit</strong> = annual labor savings − total
                  annual costs.
                </li>
                <li>
                  <strong>ROI %</strong> = net benefit ÷ total annual costs.
                </li>
              </ul>
              <p className="mt-2">
                Presets mirror common SMB workflows (similar to Salesforce-style ROI tools).
                Pick a preset then adjust fields to match your org.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

