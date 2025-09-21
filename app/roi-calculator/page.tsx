// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useState, useRef } from "react";
import Link from "next/link";

// ---------- constants ----------
const CALENDLY_URL = "https://calendly.com/your-handle/30min";

const WORKFLOW_TEMPLATES = [
  "Lead qualification",
  "FAQ / info requests",
  "Inbound email triage",
  "CRM data entry",
  "Order processing",
] as const;

type TemplateName = (typeof WORKFLOW_TEMPLATES)[number];

// ---------- types ----------
type Workflow = {
  id: string;
  name: string;
  minPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0–100
  hourly: number;
};

// ---------- utils ----------
const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtHrs = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n) + " hrs";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const uid = () => Math.random().toString(36).slice(2);

// ---------- small components ----------
function LabeledCard(props: { title: string; subtitle?: string; children: React.ReactNode; accent?: "none" | "orange" }) {
  const ring =
    props.accent === "orange"
      ? "ring-2 ring-orange-400/60"
      : "ring-1 ring-white/10";
  return (
    <div className={`rounded-2xl bg-[#0f1420] ${ring} p-5 flex flex-col gap-1 min-h-[108px]`}>
      <div className="text-xs/5 text-white/60 uppercase tracking-wide">{props.title}</div>
      <div className="text-3xl font-semibold">{props.children}</div>
      {props.subtitle && <div className="text-xs text-white/50">{props.subtitle}</div>}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 1_000_000,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      inputMode="numeric"
      className="w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-violet-400/60"
      value={String(value)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        const parsed = raw === "" || raw === "." ? 0 : Number(raw);
        if (!Number.isNaN(parsed)) onChange(clamp(parsed, min, max));
      }}
      onKeyDown={(e) => {
        // allow backspace/delete to clear
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      step={step}
    />
  );
}

function SearchablePicker({
  items,
  placeholder = "Search workflows…",
  onSelect,
}: {
  items: readonly string[];
  placeholder?: string;
  onSelect: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = items.filter((i) => i.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full text-left rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-violet-400/60"
        onClick={() => setOpen((v) => !v)}
      >
        {placeholder}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-[360px] max-w-[80vw] rounded-xl bg-[#0f1420] ring-1 ring-white/10 shadow-xl">
          <input
            autoFocus
            className="w-full bg-transparent px-3 py-2 border-b border-white/10 outline-none"
            placeholder="Type to filter…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.map((name) => (
              <li key={name}>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-white/5"
                  onClick={() => {
                    onSelect(name);
                    setOpen(false); // CLOSE on select
                    setQ("");
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-white/60">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- page ----------
export default function RoiCalculatorPage() {
  // Program settings
  const [adoptionPct, setAdoptionPct] = useState<number>(80);
  const [platformYear, setPlatformYear] = useState<number>(12000); // annual ($)
  const [aiUsageYear, setAiUsageYear] = useState<number>(6000); // annual ($)
  const [implCost, setImplCost] = useState<number>(5000);
  const [amortMonths, setAmortMonths] = useState<number>(12);

  // Workflows
  const [rows, setRows] = useState<Workflow[]>([
    {
      id: uid(),
      name: "FAQ / info requests",
      minPerTask: 4,
      tasksPerMonth: 1500,
      people: 2,
      automationPct: 60,
      hourly: 45,
    },
    {
      id: uid(),
      name: "Lead qualification",
      minPerTask: 7,
      tasksPerMonth: 600,
      people: 1,
      automationPct: 50,
      hourly: 45,
    },
  ]);

  const addWorkflow = (name?: TemplateName) => {
    setRows((r) => [
      ...r,
      {
        id: uid(),
        name: name ?? "New workflow",
        minPerTask: 5,
        tasksPerMonth: 500,
        people: 1,
        automationPct: 50,
        hourly: 40,
      },
    ]);
  };

  const removeRow = (id: string) => setRows((r) => r.filter((w) => w.id !== id));

  // ----- calcs -----
  const totals = useMemo(() => {
    // hours saved per row
    const rowHours = rows.map((w) => {
      const minutes = w.minPerTask * w.tasksPerMonth * 12;
      const auto = minutes * (w.automationPct / 100) * (adoptionPct / 100);
      return auto / 60; // to hours
    });
    const annualHoursSaved = rowHours.reduce((a, b) => a + b, 0);

    const annualLaborSavings = rows.reduce((sum, w, i) => {
      const saveHrs = rowHours[i];
      return sum + saveHrs * w.hourly;
    }, 0);

    const totalAnnualCosts =
      platformYear +
      aiUsageYear +
      (implCost / Math.max(1, amortMonths)) * 12;

    const netBenefit = annualLaborSavings - totalAnnualCosts;
    const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : 0;

    return {
      annualHoursSaved,
      annualLaborSavings,
      totalAnnualCosts,
      netBenefit,
      roiPct,
    };
  }, [rows, adoptionPct, platformYear, aiUsageYear, implCost, amortMonths]);

  // ---------- render ----------
  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-6 text-white">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">AI ROI Calculators</h1>
          <p className="text-white/70 mt-1">
            Estimate time & cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>

        <Link
          href={CALENDLY_URL}
          className="shrink-0 rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400 transition"
        >
          Book a call with these results
        </Link>
      </div>

      {/* Top summary cards (dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <LabeledCard title="ANNUAL HRS SAVED" subtitle="≈ based on 2080 hrs/yr">
          {fmtHrs(totals.annualHoursSaved)}
        </LabeledCard>

        <LabeledCard title="ANNUAL LABOR SAVINGS" subtitle="before software costs">
          {fmtMoney(totals.annualLaborSavings)}
        </LabeledCard>

        <LabeledCard title="TOTAL ANNUAL COSTS" subtitle="platform + usage + build">
          {fmtMoney(totals.totalAnnualCosts)}
        </LabeledCard>

        <LabeledCard title="NET BENEFIT / ROI" accent="orange">
          <div className="flex items-baseline gap-3">
            <span>{fmtMoney(totals.netBenefit)}</span>
            <span className="text-emerald-400 text-lg font-semibold">
              {Number.isFinite(totals.roiPct) ? `${Math.round(totals.roiPct)}% ROI` : "—"}
            </span>
          </div>
        </LabeledCard>
      </div>

      {/* Program settings */}
      <div className="rounded-2xl bg-[#0b1020] ring-1 ring-white/10 p-5 mb-6">
        <div className="text-sm/5 text-white/60 uppercase tracking-wide mb-3">Program settings</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <div className="text-xs text-white/60 mb-2">Adoption (% of eligible work)</div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={adoptionPct}
                onChange={(e) => setAdoptionPct(Number(e.target.value))}
                className="w-full"
              />
              <div className="w-[56px] text-center rounded-lg bg-white/5 ring-1 ring-white/10 py-1">
                {adoptionPct}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-white/60 mb-2">Platform cost (annual)</div>
            <NumberInput value={platformYear} onChange={setPlatformYear} step={100} />
          </div>

          <div>
            <div className="text-xs text-white/60 mb-2">AI usage (annual)</div>
            <NumberInput value={aiUsageYear} onChange={setAiUsageYear} step={100} />
          </div>

          <div>
            <div className="text-xs text-white/60 mb-2">Implementation (one-time)</div>
            <NumberInput value={implCost} onChange={setImplCost} step={100} />
          </div>

          <div>
            <div className="text-xs text-white/60 mb-2">Amortize (months)</div>
            <NumberInput value={amortMonths} onChange={setAmortMonths} step={1} />
          </div>
        </div>
      </div>

      {/* Workflows */}
      <div className="rounded-2xl bg-[#0b1020] ring-1 ring-white/10 p-5">
        <div className="text-sm/5 text-white/60 uppercase tracking-wide mb-3">Workflows</div>

        <div className="mb-4">
          <SearchablePicker
            items={WORKFLOW_TEMPLATES}
            placeholder="+ Add from templates (search)"
            onSelect={(name) => addWorkflow(name as TemplateName)}
          />
        </div>

        <div className="space-y-4">
          {rows.map((w) => (
            <div key={w.id} className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-xs text-white/60 mb-1">Workflow name</div>
                  <input
                    className="w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-violet-400/60"
                    value={w.name}
                    onChange={(e) =>
                      setRows((r) => r.map((x) => (x.id === w.id ? { ...x, name: e.target.value } : x)))
                    }
                  />
                </div>

                <div>
                  <div className="text-xs text-white/60 mb-1">Minutes per task</div>
                  <NumberInput
                    value={w.minPerTask}
                    onChange={(v) => setRows((r) => r.map((x) => (x.id === w.id ? { ...x, minPerTask: v } : x)))}
                    step={1}
                  />
                </div>

                <div>
                  <div className="text-xs text-white/60 mb-1">Tasks per month</div>
                  <NumberInput
                    value={w.tasksPerMonth}
                    onChange={(v) => setRows((r) => r.map((x) => (x.id === w.id ? { ...x, tasksPerMonth: v } : x)))}
                    step={10}
                  />
                </div>

                <div>
                  <div className="text-xs text-white/60 mb-1">People</div>
                  <NumberInput
                    value={w.people}
                    onChange={(v) => setRows((r) => r.map((x) => (x.id === w.id ? { ...x, people: v } : x)))}
                    step={1}
                  />
                </div>

                <div>
                  <div className="text-xs text-white/60 mb-1">Automation %</div>
                  <NumberInput
                    value={w.automationPct}
                    onChange={(v) =>
                      setRows((r) => r.map((x) => (x.id === w.id ? { ...x, automationPct: clamp(v, 0, 100) } : x)))
                    }
                    step={1}
                  />
                </div>

                <div>
                  <div className="text-xs text-white/60 mb-1">Hourly $</div>
                  <NumberInput
                    value={w.hourly}
                    onChange={(v) => setRows((r) => r.map((x) => (x.id === w.id ? { ...x, hourly: v } : x)))}
                    step={1}
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  className="text-sm text-rose-400 hover:text-rose-300"
                  onClick={() => removeRow(w.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculation Summary (accordion-like, closed text already chosen; here we keep it OPEN when user expands) */}
      <details className="mt-6 rounded-2xl bg-[#0b1020] ring-1 ring-white/10 p-5">
        <summary className="cursor-pointer text-lg font-semibold">Calculation Summary</summary>
        <div className="mt-4 space-y-6 text-white/90 leading-7">
          <p>
            <span className="font-semibold">Benefit.</span> We estimate hours saved by multiplying{" "}
            <em>minutes per task × tasks per month × 12 × automation rate × program adoption</em>. Labor savings = hours
            saved × hourly rate. FTE saved uses ~2080 hrs/year.
          </p>
          <p>
            <span className="font-semibold">Costs.</span> Total annual cost ={" "}
            <em>platform (annual) + AI usage (annual) + implementation (one-time amortized across your chosen months)</em>.
          </p>
          <p>
            <span className="font-semibold">ROI.</span> ROI% = <em>net benefit ÷ total annual cost</em> × 100, where Net
            Benefit = Labor Savings – Total Annual Cost.
          </p>
        </div>
      </details>

      {/* Disclaimer – always visible */}
      <div className="mt-4 text-sm text-white/60 leading-6">
        The results of this tool are provided for illustrative purposes only to help you explore potential benefits of AI
        automation in your organization. Actual outcomes will vary and are not a guarantee or commitment of financial
        return. Results depend on factors including (but not limited to) implementation practices, user adoption,
        workflow design and configurations, organizational processes, market conditions, and external economic factors.
        All calculations are presented in US dollars unless otherwise noted.
      </div>
    </div>
  );
}

