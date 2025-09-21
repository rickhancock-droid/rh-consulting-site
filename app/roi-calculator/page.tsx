// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

// ---------- types ----------
type WorkflowTemplateKey =
  | "Lead qualification"
  | "FAQ / info requests"
  | "Inbound email"
  | "CRM data entry"
  | "Meeting notes ➜ CRM"
  | "Support triage"
  | "Order processing"
  | "Report generation";

type WorkflowRow = {
  id: string;
  name: WorkflowTemplateKey | string;
  minPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0-100
  hourly: number;
};

// Preset workflow menu (kept concise and useful)
const WORKFLOW_TEMPLATES: Array<{ label: WorkflowTemplateKey; defaults: Omit<WorkflowRow, "id" | "name"> & { hourly?: number } }> = [
  {
    label: "Lead qualification",
    defaults: { minPerTask: 6, tasksPerMonth: 100, people: 10, automationPct: 60, hourly: 45 },
  },
  {
    label: "FAQ / info requests",
    defaults: { minPerTask: 4, tasksPerMonth: 600, people: 1, automationPct: 55, hourly: 40 },
  },
  {
    label: "Inbound email",
    defaults: { minPerTask: 5, tasksPerMonth: 1200, people: 2, automationPct: 60, hourly: 40 },
  },
  {
    label: "CRM data entry",
    defaults: { minPerTask: 3, tasksPerMonth: 1600, people: 2, automationPct: 70, hourly: 40 },
  },
  {
    label: "Meeting notes ➜ CRM",
    defaults: { minPerTask: 7, tasksPerMonth: 240, people: 6, automationPct: 60, hourly: 45 },
  },
  {
    label: "Support triage",
    defaults: { minPerTask: 3, tasksPerMonth: 900, people: 4, automationPct: 65, hourly: 42 },
  },
  {
    label: "Order processing",
    defaults: { minPerTask: 4, tasksPerMonth: 450, people: 3, automationPct: 60, hourly: 44 },
  },
  {
    label: "Report generation",
    defaults: { minPerTask: 10, tasksPerMonth: 80, people: 2, automationPct: 70, hourly: 46 },
  },
];

// ---------- helpers ----------
const fmtMoney = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const pct = (n: number) => `${n.toFixed(0)}%`;
const toNum = (v: string) => Number((v || "0").replace(/[^\d.]/g, "")) || 0;

// ---------- main ----------
export default function RoiCalculatorPage() {
  // Defaults mirror a ~100-employee SMB vibe
  const [adoption, setAdoption] = useState<number>(80); // %
  const [platformMo, setPlatformMo] = useState<number>(300);
  const [aiUsageMo, setAiUsageMo] = useState<number>(180);
  const [implOneTime, setImplOneTime] = useState<number>(2500);
  const [amortizeMonths, setAmortizeMonths] = useState<number>(12);

  const [rows, setRows] = useState<WorkflowRow[]>([
    rowFromTemplate("Lead qualification"),
    rowFromTemplate("FAQ / info requests"),
  ]);

  function rowFromTemplate(label: WorkflowTemplateKey): WorkflowRow {
    const t = WORKFLOW_TEMPLATES.find((x) => x.label === label)!;
    return {
      id: cryptoId(),
      name: label,
      minPerTask: t.defaults.minPerTask,
      tasksPerMonth: t.defaults.tasksPerMonth,
      people: t.defaults.people,
      automationPct: t.defaults.automationPct,
      hourly: t.defaults.hourly ?? 45,
    };
  }

  function cryptoId() {
    return Math.random().toString(36).slice(2, 9);
  }

  function addRow() {
    setRows((r) => [...r, rowFromTemplate("Inbound email")]);
  }

  function removeRow(id: string) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  }

  function update<K extends keyof WorkflowRow>(id: string, key: K, value: WorkflowRow[K]) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
  }

  // ---- calculations ----
  const { annualHours, annualLaborSavings, totalAnnualCosts, netBenefit, roiPct } = useMemo(() => {
    // hours saved per workflow = min/task × tasks/mo × people × automation% × adoption% × 12 / 60
    const hoursByRow = rows.map((r) => {
      const h =
        (r.minPerTask * r.tasksPerMonth * r.people * (r.automationPct / 100) * (adoption / 100) * 12) / 60;
      return h;
    });
    const annualHoursSaved = hoursByRow.reduce((a, b) => a + b, 0);

    const laborSaved = rows.reduce((sum, r, i) => sum + hoursByRow[i] * r.hourly, 0);

    const costAnnual =
      (platformMo + aiUsageMo) * 12 +
      (amortizeMonths > 0 ? implOneTime * (12 / amortizeMonths) : implOneTime);

    const net = laborSaved - costAnnual;
    const roi = costAnnual > 0 ? (net / costAnnual) * 100 : 0;

    return {
      annualHours: annualHoursSaved,
      annualLaborSavings: laborSaved,
      totalAnnualCosts: costAnnual,
      netBenefit: net,
      roiPct: roi,
    };
  }, [rows, adoption, platformMo, aiUsageMo, implOneTime, amortizeMonths]);

  // ---------- UI ----------
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header + CTA */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">AI ROI Calculators</h1>
          <p className="mt-3 text-muted-foreground">
            Estimate time & cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>
        <Link
          href="https://calendly.com/rh-consulting/intro"
          className="shrink-0 rounded-full bg-indigo-500 px-5 py-3 text-white font-medium shadow-lg hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          Book a Call (passes your ROI)
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="ANNUAL HOURS SAVED" subtitle={`≈ ${(annualHours / 2080).toFixed(1)} FTE`}>
          {annualHours.toFixed(1)} hrs
        </KpiCard>
        <KpiCard title="ANNUAL LABOR SAVINGS" subtitle="before software costs">
          {fmtMoney(annualLaborSavings)}
        </KpiCard>
        <KpiCard title="TOTAL ANNUAL COSTS" subtitle="platform + usage + build">
          {fmtMoney(totalAnnualCosts)}
        </KpiCard>
        <KpiCard
          title="NET BENEFIT / ROI"
          subtitle={`${fmtMoney(netBenefit)} net`}
          accent
        >
          <span className={netBenefit >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {pct(roiPct)}
          </span>
        </KpiCard>
      </div>

      {/* Global controls */}
      <div className="mt-6 grid gap-4 rounded-2xl border border-border/50 bg-card p-4 md:grid-cols-12">
        <div className="md:col-span-12">
          <label className="block text-xs font-semibold tracking-wider mb-2">Adoption Rate (%)</label>
          <input
            type="range"
            min={0}
            max={100}
            value={adoption}
            onChange={(e) => setAdoption(toNum(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground mt-1">{pct(adoption)} of eligible work</div>
        </div>

        <NumberField
          className="md:col-span-3"
          label="Platform cost / mo"
          value={platformMo}
          onChange={(n) => setPlatformMo(clamp(n, 0, 100000))}
        />
        <NumberField
          className="md:col-span-3"
          label="AI usage / mo"
          value={aiUsageMo}
          onChange={(n) => setAiUsageMo(clamp(n, 0, 100000))}
        />
        <NumberField
          className="md:col-span-3"
          label="Implementation (one-time)"
          value={implOneTime}
          onChange={(n) => setImplOneTime(clamp(n, 0, 1000000))}
        />
        <NumberField
          className="md:col-span-3"
          label="Amortize (months)"
          value={amortizeMonths}
          onChange={(n) => setAmortizeMonths(clamp(n, 1, 60))}
        />
      </div>

      {/* Workflows table */}
      <div className="mt-6 rounded-2xl border border-border/50 bg-card p-4">
        <div className="grid grid-cols-12 gap-3 text-xs font-semibold tracking-wider text-muted-foreground mb-2">
          <div className="col-span-3">Workflow</div>
          <div className="col-span-1">Min/Task</div>
          <div className="col-span-2">Tasks/mo</div>
          <div className="col-span-2">People</div>
          <div className="col-span-2">Automation %</div>
          <div className="col-span-2">Hourly $</div>
        </div>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-3 items-center">
              {/* Workflow simple searchable select (type-to-search) */}
              <div className="col-span-3">
                <label className="sr-only">Workflow</label>
                <select
                  value={r.name}
                  onChange={(e) => {
                    const label = e.target.value as WorkflowTemplateKey;
                    const t = WORKFLOW_TEMPLATES.find((x) => x.label === label);
                    if (t) {
                      // When picking a template, hydrate the row with sensible defaults
                      update(r.id, "name", label);
                      update(r.id, "minPerTask", t.defaults.minPerTask);
                      update(r.id, "tasksPerMonth", t.defaults.tasksPerMonth);
                      update(r.id, "people", t.defaults.people);
                      update(r.id, "automationPct", t.defaults.automationPct);
                      if (t.defaults.hourly) update(r.id, "hourly", t.defaults.hourly);
                    } else {
                      update(r.id, "name", label);
                    }
                  }}
                  className="w-full rounded-xl bg-background border border-border/60 px-3 py-2"
                >
                  {WORKFLOW_TEMPLATES.map((opt) => (
                    <option key={opt.label} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <NumberField
                  value={r.minPerTask}
                  onChange={(n) => update(r.id, "minPerTask", clamp(n, 0, 600))}
                />
              </div>
              <div className="col-span-2">
                <NumberField
                  value={r.tasksPerMonth}
                  onChange={(n) => update(r.id, "tasksPerMonth", clamp(n, 0, 1_000_000))}
                />
              </div>
              <div className="col-span-2">
                <NumberField
                  value={r.people}
                  onChange={(n) => update(r.id, "people", clamp(n, 0, 100000))}
                />
              </div>
              <div className="col-span-2">
                <NumberField
                  value={r.automationPct}
                  onChange={(n) => update(r.id, "automationPct", clamp(n, 0, 100))}
                />
              </div>
              <div className="col-span-2">
                <NumberField
                  value={r.hourly}
                  onChange={(n) => update(r.id, "hourly", clamp(n, 0, 1000))}
                />
              </div>

              <div className="col-span-12 flex justify-end">
                <button
                  className="text-rose-400 hover:text-rose-300 text-sm"
                  onClick={() => removeRow(r.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={addRow}
            className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/20"
          >
            + Add workflow
          </button>
        </div>
      </div>

      {/* Calculation Summary (carrot) */}
      <details className="mt-6 rounded-2xl border border-border/50 bg-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">Calculation Summary</summary>
        <div className="mt-4 space-y-3 text-sm leading-6">
          <p>
            <strong>Benefit:</strong> We estimate a portion of repetitive work shifts from humans to AI
            agents, with adoption ramping over time. Hours saved are based on:{" "}
            <em>
              employees × minutes per task × tasks per month × automation % × adoption % × 12 months
            </em>
            . This reflects productivity gains from reduced manual effort and faster completion.
          </p>
          <p>
            <strong>Program Cost:</strong> Includes monthly platform costs, AI usage fees, and a
            one-time implementation cost, amortized across the selected number of months.
          </p>
          <p>
            <strong>Net Impact:</strong> Net benefit equals annual labor savings minus total annual
            costs. ROI % is <em>net benefit ÷ total annual costs</em>.
          </p>
        </div>
      </details>

      {/* Disclaimer (always visible) */}
      <div className="mt-4 text-xs text-muted-foreground leading-6">
        <p>
          The results of this calculator are provided for illustrative purposes only to help you
          explore potential benefits of AI automation in your organization. Actual outcomes will vary
          and are not a guarantee or commitment of financial return.
        </p>
        <p className="mt-2">
          Results depend on factors including but not limited to implementation practices, user
          adoption, workflow design and configurations, organizational processes, market conditions,
          and external economic factors. All calculations are presented in US dollars unless otherwise
          noted.
        </p>
      </div>
    </div>
  );
}

// ---------- small components ----------
function KpiCard({
  title,
  subtitle,
  children,
  accent = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border px-5 py-4",
        accent ? "border-amber-400/40" : "border-border/60",
        "bg-card",
      ].join(" ")}
    >
      <div className="text-xs font-semibold tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{children}</div>
      {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  className = "",
}: {
  label?: string;
  value: number;
  onChange: (n: number) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold tracking-wider mb-1">{label}</label>}
      <input
        type="text"
        inputMode="decimal"
        value={String(value)}
        onChange={(e) => onChange(toNum(e.target.value))}
        className="w-full rounded-xl bg-background border border-border/60 px-3 py-2"
      />
    </div>
  );
}

