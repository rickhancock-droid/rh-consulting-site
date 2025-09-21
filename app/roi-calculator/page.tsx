k// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useState } from "react";

// ---------- helpers ----------
const fmtMoney = (n: number, currency: string = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(isFinite(n) ? n : 0);

const fmt1 = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    isFinite(n) ? n : 0
  );

const toNum = (v: string | number) => {
  if (typeof v === "number") return v;
  // allow user to clear field to "" without crashing
  const cleaned = v.replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
  return Number(cleaned);
};

const clamp = (n: number, min: number, max: number) =>
  isFinite(n) ? Math.min(max, Math.max(min, n)) : min;

const HOURS_PER_FTE = 2080;
const SCHEDULER_URL =
  "https://calendly.com/rick-hancock-rhconsulting/30min"; // update anytime

// ---------- types ----------
type Row = {
  id: string;
  name: string;
  minutes: number; // minutes per task
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0..100
  hourlyCost: number;
};

// ---------- component ----------
export default function ROICalculatorPage() {
  // Defaults mirror a ~100-employee SMB
  const [adoptionPct, setAdoptionPct] = useState<number>(80);
  const [platformMonthly, setPlatformMonthly] = useState<number>(300);
  const [aiUsageMonthly, setAiUsageMonthly] = useState<number>(180);
  const [implOneTime, setImplOneTime] = useState<number>(2500);
  const [amortizeMonths, setAmortizeMonths] = useState<number>(12);

  const [rows, setRows] = useState<Row[]>([
    {
      id: crypto.randomUUID(),
      name: "Lead qualification",
      minutes: 6,
      tasksPerMonth: 100,
      people: 10,
      automationPct: 60,
      hourlyCost: 45,
    },
    {
      id: crypto.randomUUID(),
      name: "FAQ / info requests",
      minutes: 4,
      tasksPerMonth: 600,
      people: 1,
      automationPct: 55,
      hourlyCost: 40,
    },
  ]);

  // ---------- math ----------
  const results = useMemo(() => {
    const adoption = clamp(adoptionPct, 0, 100) / 100;

    let totalHours = 0;
    let totalLaborSavings = 0;

    const detailed = rows.map((r) => {
      const mins = Math.max(0, r.minutes || 0);
      const tasks = Math.max(0, r.tasksPerMonth || 0);
      const ppl = Math.max(0, r.people || 0);
      const auto = clamp(r.automationPct || 0, 0, 100) / 100;
      const rate = Math.max(0, r.hourlyCost || 0);

      const hoursSaved =
        ((mins * tasks * ppl * auto * adoption * 12) / 60) || 0;
      const dollars = hoursSaved * rate;

      totalHours += hoursSaved;
      totalLaborSavings += dollars;

      return { ...r, hoursSaved, dollars };
    });

    const annualCosts =
      platformMonthly * 12 +
      aiUsageMonthly * 12 +
      (amortizeMonths > 0 ? implOneTime / amortizeMonths : implOneTime);

    const net = totalLaborSavings - annualCosts;
    const roiPct = annualCosts > 0 ? (net / annualCosts) * 100 : 0;

    return {
      detailed,
      totalHours,
      fte: totalHours / HOURS_PER_FTE,
      totalLaborSavings,
      annualCosts,
      net,
      roiPct,
    };
  }, [
    rows,
    adoptionPct,
    platformMonthly,
    aiUsageMonthly,
    implOneTime,
    amortizeMonths,
  ]);

  // build scheduler URL with query params (simple + readable)
  const schedUrl = useMemo(() => {
    const p = new URLSearchParams({
      hours: String(Math.round(results.totalHours)),
      fte: fmt1(results.fte),
      savings: fmtMoney(results.totalLaborSavings).replace(/[^0-9]/g, ""),
      costs: fmtMoney(results.annualCosts).replace(/[^0-9]/g, ""),
      net: fmtMoney(results.net).replace(/[^0-9]/g, ""),
      roi: `${Math.round(results.roiPct)}`,
      source: "roi-calculator",
    });
    return `${SCHEDULER_URL}?${p.toString()}`;
  }, [results]);

  // ---------- small inputs that allow free typing ----------
  const NumInput = ({
    value,
    onChange,
    min,
    max,
    step = 1,
  }: {
    value: number;
    onChange: (n: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <input
      inputMode="decimal"
      className="w-full rounded-xl bg-slate-900/30 dark:bg-slate-900/40 border border-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
      value={Number.isNaN(value) ? "" : String(value)}
      onChange={(e) => {
        const n = toNum(e.target.value);
        if (Number.isNaN(n)) {
          // let the field be temporarily empty
          onChange(NaN as unknown as number);
        } else {
          let v = n;
          if (typeof min === "number") v = Math.max(min, v);
          if (typeof max === "number") v = Math.min(max, v);
          onChange(v);
        }
      }}
      onBlur={(e) => {
        // normalize on blur
        const n = toNum(e.target.value);
        let v = Number.isNaN(n) ? 0 : n;
        if (typeof min === "number") v = Math.max(min, v);
        if (typeof max === "number") v = Math.min(max, v);
        onChange(v);
      }}
      step={step}
    />
  );

  // ---------- UI ----------
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
        AI ROI Calculators
      </h1>
      <p className="mt-2 text-slate-400">
        Estimate time &amp; cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
      </p>

      {/* Top-right CTA (above the KPI numbers) */}
      <div className="mt-4 mb-2 flex justify-end">
        <a
          href={schedUrl}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 shadow-sm transition-colors"
        >
          Book a Call (passes your ROI)
        </a>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi title="Hours saved / yr" value={`${fmt1(results.totalHours)}`} sub={`≈ ${fmt1(results.fte)} FTE`} />
        <Kpi title="FTE equivalent" value={`${fmt1(results.fte)}`} sub={`based on ${HOURS_PER_FTE} hrs/yr`} />
        <Kpi title="Labor savings / yr" value={fmtMoney(results.totalLaborSavings)} />
        <Kpi title="ROI" value={`${Math.round(results.roiPct)}%`} highlight />
      </div>

      {/* Program knobs (slim to keep 1-page fit) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Adoption Rate (%)</label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={adoptionPct}
            onChange={(e) => setAdoptionPct(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-slate-500 mt-1">
            {adoptionPct}% of eligible work
          </p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Platform cost / mo</label>
          <NumInput value={platformMonthly} onChange={setPlatformMonthly} min={0} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">AI usage / mo</label>
          <NumInput value={aiUsageMonthly} onChange={setAiUsageMonthly} min={0} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Implementation (one-time)</label>
          <NumInput value={implOneTime} onChange={setImplOneTime} min={0} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Amortize over (months)</label>
          <NumInput value={amortizeMonths} onChange={setAmortizeMonths} min={1} />
        </div>
      </div>

      {/* Workflows table (compact) */}
      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/30">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-slate-400">
          <div className="col-span-3">Workflow</div>
          <div className="col-span-1 text-center">Min/Task</div>
          <div className="col-span-2 text-center">Tasks / mo</div>
          <div className="col-span-1 text-center">People</div>
          <div className="col-span-2 text-center">Automation %</div>
          <div className="col-span-1 text-center">Hourly $</div>
          <div className="col-span-2 text-right">Annual $ saved</div>
        </div>

        {results.detailed.map((r, idx) => (
          <div
            key={r.id}
            className="grid grid-cols-12 gap-2 px-4 py-2 items-center border-t border-slate-800/60"
          >
            <input
              className="col-span-3 rounded-xl bg-slate-900/40 border border-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              value={r.name}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((row, i) =>
                    i === idx ? { ...row, name: e.target.value } : row
                  )
                )
              }
            />
            <div className="col-span-1">
              <NumInput
                value={r.minutes}
                onChange={(n) =>
                  setRows((p) =>
                    p.map((row, i) => (i === idx ? { ...row, minutes: n || 0 } : row))
                  )
                }
                min={0}
              />
            </div>
            <div className="col-span-2">
              <NumInput
                value={r.tasksPerMonth}
                onChange={(n) =>
                  setRows((p) =>
                    p.map((row, i) =>
                      i === idx ? { ...row, tasksPerMonth: n || 0 } : row
                    )
                  )
                }
                min={0}
              />
            </div>
            <div className="col-span-1">
              <NumInput
                value={r.people}
                onChange={(n) =>
                  setRows((p) =>
                    p.map((row, i) => (i === idx ? { ...row, people: n || 0 } : row))
                  )
                }
                min={0}
              />
            </div>
            <div className="col-span-2">
              <NumInput
                value={r.automationPct}
                onChange={(n) =>
                  setRows((p) =>
                    p.map((row, i) =>
                      i === idx
                        ? { ...row, automationPct: clamp(n || 0, 0, 100) }
                        : row
                    )
                  )
                }
                min={0}
                max={100}
              />
            </div>
            <div className="col-span-1">
              <NumInput
                value={r.hourlyCost}
                onChange={(n) =>
                  setRows((p) =>
                    p.map((row, i) => (i === idx ? { ...row, hourlyCost: n || 0 } : row))
                  )
                }
                min={0}
              />
            </div>
            <div className="col-span-2 text-right text-slate-200">
              {fmtMoney(r.dollars)}
            </div>
          </div>
        ))}

        <div className="px-4 py-3 border-t border-slate-800/60 flex items-center justify-between">
          <button
            onClick={() =>
              setRows((p) => [
                ...p,
                {
                  id: crypto.randomUUID(),
                  name: "New workflow",
                  minutes: 3,
                  tasksPerMonth: 100,
                  people: 1,
                  automationPct: 50,
                  hourlyCost: 40,
                },
              ])
            }
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-2 text-sm"
          >
            + Add workflow
          </button>
          <div className="text-sm text-slate-400">
            Total annual costs:{" "}
            <span className="text-slate-200">{fmtMoney(results.annualCosts)}</span>
          </div>
        </div>
      </div>

      {/* Summary cards (kept compact to keep within 1 page) */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Annual hours saved" value={`${fmt1(results.totalHours)} hrs`} sub={`≈ ${fmt1(results.fte)} FTE`} />
        <SummaryCard title="Annual labor savings" value={fmtMoney(results.totalLaborSavings)} sub="before software costs" />
        <SummaryCard title="Net benefit / ROI" value={`${fmtMoney(results.net)} (${Math.round(results.roiPct)}%)`} />
      </div>

      {/* Explainer (tight width so lines reach right edge) */}
      <details className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <summary className="cursor-pointer text-slate-200 font-semibold">
          How we calculate ROI
        </summary>
        <ul className="mt-3 space-y-3 text-slate-300">
          <li>
            <span className="font-semibold">Hours saved / workflow</span> = minutes per task × tasks/mo × people × automation% × adoption% × 12 months.
          </li>
          <li>
            <span className="font-semibold">Annual $ saved</span> = hours saved × hourly cost (loaded).
          </li>
          <li>
            <span className="font-semibold">Total annual costs</span> = (platform/mo + AI usage/mo) × 12 + (implementation ÷ amortize months) × 12.
          </li>
          <li>
            <span className="font-semibold">Net benefit</span> = annual labor savings – total annual costs.
          </li>
          <li>
            <span className="font-semibold">ROI %</span> = net benefit ÷ total annual costs.
          </li>
        </ul>
        <p className="mt-4 text-slate-400">
          Defaults mirror a typical ~100-employee SMB. Tune adoption and automation% to your reality.
        </p>
      </details>
    </div>
  );
}

// ---------- small presentational bits ----------
function Kpi({
  title,
  value,
  sub,
  highlight = false,
}: {
  title: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="text-xs text-slate-400">{title}</div>
      <div className={`mt-1 text-2xl font-semibold ${highlight ? "text-emerald-400" : "text-slate-100"}`}>
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-100">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

