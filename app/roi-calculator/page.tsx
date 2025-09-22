// app/roi-calculator/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ---------- constants ----------
const LOGO_PATH = "/Original on transparent.png"; // already in /public
const WORKFLOW_TEMPLATES = [
  "Lead qualification",
  "FAQ / info requests",
  "Inbound email triage",
  "CRM data entry",
  "Order processing",
] as const;

type Workflow = {
  id: string;
  name: string;
  minPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number;
  hourly: number;
};

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const number1 = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n);

const calcWorkflowHoursPerYear = (w: Workflow, adoptionPct: number) =>
  ((w.minPerTask * w.tasksPerMonth * w.people) / 60) * (w.automationPct / 100) * (adoptionPct / 100) * 12;

function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

// ---------- page ----------
export default function RoiCalculatorPage() {
  // Program settings (SMB defaults)
  const [adoption, setAdoption] = useState(80);
  const [platformAnnual, setPlatformAnnual] = useState(12000);
  const [aiUsageAnnual, setAiUsageAnnual] = useState(6000);
  const [implCost, setImplCost] = useState(5000);
  const [amortizeMonths, setAmortizeMonths] = useState(12);

  // Workflows
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id: crypto.randomUUID(), name: "FAQ / info requests", minPerTask: 4, tasksPerMonth: 1500, people: 2, automationPct: 60, hourly: 45 },
    { id: crypto.randomUUID(), name: "Lead qualification", minPerTask: 7, tasksPerMonth: 600, people: 1, automationPct: 50, hourly: 45 },
  ]);

  // Template dropdown (searchable)
  const [openPicker, setOpenPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const pickerRef = useClickOutside<HTMLDivElement>(() => setOpenPicker(false));

  const filteredTemplates = useMemo(() => {
    const q = pickerQuery.toLowerCase().trim();
    if (!q) return WORKFLOW_TEMPLATES;
    return WORKFLOW_TEMPLATES.filter((t) => t.toLowerCase().includes(q));
  }, [pickerQuery]);

  // Totals
  const totals = useMemo(() => {
    const hoursSaved = workflows.reduce((sum, w) => sum + calcWorkflowHoursPerYear(w, adoption), 0);
    const laborSavings = workflows.reduce((sum, w) => sum + calcWorkflowHoursPerYear(w, adoption) * w.hourly, 0);
    const annualizedImpl = implCost / Math.max(1, amortizeMonths) * 12; // spread across a year for clarity
    const totalCost = platformAnnual + aiUsageAnnual + annualizedImpl;
    const netBenefit = laborSavings - totalCost;
    const roiPct = totalCost > 0 ? (netBenefit / totalCost) * 100 : 0;
    return { hoursSaved, laborSavings, totalCost, netBenefit, roiPct };
  }, [workflows, adoption, platformAnnual, aiUsageAnnual, implCost, amortizeMonths]);

  // PDF export (includes logo + summary)
  const pdfRootRef = useRef<HTMLDivElement | null>(null);
  async function exportPDF() {
    const el = pdfRootRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#0b1020" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;

    // Logo (optional)
    try {
      const logo = await loadImage(LOGO_PATH);
      const logoW = 120, logoH = (logo.height / logo.width) * logoW;
      pdf.addImage(logo, "PNG", 40, 28, logoW, logoH);
    } catch {
      // no logo – ignore
    }

    pdf.addImage(img, "PNG", (pageW - w) / 2, 80, w, h);
    pdf.save("RH-Consulting-ROI.pdf");
  }
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
  }

  // helpers to update workflow fields
  function up(id: string, patch: Partial<Workflow>) {
    setWorkflows((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  function addTemplate(name: string) {
    setWorkflows((ws) => [
      ...ws,
      {
        id: crypto.randomUUID(),
        name,
        minPerTask: 5,
        tasksPerMonth: 500,
        people: 1,
        automationPct: 50,
        hourly: 45,
      },
    ]);
    setOpenPicker(false);
    setPickerQuery("");
  }
  function removeRow(id: string) {
    setWorkflows((ws) => ws.filter((w) => w.id !== id));
  }

  return (
    <div className="px-6 md:px-10 pb-24 pt-6 text-slate-100">
      {/* TOP BAR: Title + CTA */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">AI ROI Calculators</h1>
          <p className="text-slate-300 mt-2">
            Estimate time & cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>

        <button
          onClick={exportPDF}
          className="self-start rounded-2xl px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-medium shadow-md"
        >
          Download PDF
        </button>
      </div>

      {/* KPI ROW */}
      <div ref={pdfRootRef} className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi title="ANNUAL HRS SAVED" subtitle={`≈ ${number1(totals.hoursSaved / 2080)} FTE`}>
          {number1(totals.hoursSaved)} hrs
        </Kpi>

        <Kpi title="ANNUAL LABOR SAVINGS" subtitle="before software costs">
          {currency(totals.laborSavings)}
        </Kpi>

        <Kpi title="TOTAL ANNUAL COSTS" subtitle="platform + usage + build">
          {currency(totals.totalCost)}
        </Kpi>

        {/* Combined Net Benefit + ROI */}
        <div className="rounded-3xl border border-orange-600/40 bg-orange-500/10 p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-300">NET BENEFIT / ROI</div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl md:text-4xl font-extrabold text-slate-50">
              {currency(totals.netBenefit)}
            </div>
            <div className="ml-4 text-3xl md:text-4xl font-extrabold text-emerald-400">
              {Math.round(totals.roiPct)}%
            </div>
          </div>
        </div>
      </div>

      {/* PROGRAM SETTINGS */}
      <section className="mt-8 rounded-3xl bg-slate-900/50 border border-slate-700/50 p-5">
        <div className="text-slate-300 font-semibold mb-3">Program settings</div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Adoption */}
          <div className="rounded-2xl bg-slate-800/60 p-4">
            <div className="text-xs text-slate-300 mb-1">Adoption (% of eligible work)</div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={adoption}
                onChange={(e) => setAdoption(Number(e.target.value))}
                className="w-full"
              />
              <div className="w-14 text-center rounded-xl bg-slate-700 px-2 py-1">{adoption}</div>
            </div>
          </div>

          {/* Platform annual */}
          <NumField label="Platform cost (annual)" value={platformAnnual} onChange={setPlatformAnnual} prefix="$" />
          {/* AI annual */}
          <NumField label="AI usage (annual)" value={aiUsageAnnual} onChange={setAiUsageAnnual} prefix="$" />
          {/* Implementation / months */}
          <NumField label="Implementation (one-time)" value={implCost} onChange={setImplCost} prefix="$" />
          <NumField label="Amortize (months)" value={amortizeMonths} onChange={setAmortizeMonths} />
        </div>
      </section>

      {/* WORKFLOWS */}
      <section className="mt-6 rounded-3xl bg-slate-900/50 border border-slate-700/50 p-5">
        <div className="flex items-center justify-between">
          <div className="text-slate-300 font-semibold">Workflows</div>

          {/* Add from templates (searchable) */}
          <div ref={pickerRef} className="relative">
            <button
              onClick={() => setOpenPicker((v) => !v)}
              className="rounded-xl px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600"
            >
              + Add from templates (search)
            </button>

            {openPicker && (
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
                <input
                  autoFocus
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Type to filter…"
                  className="w-full bg-transparent px-3 py-2 border-b border-slate-700 outline-none"
                />
                <ul className="max-h-72 overflow-auto py-1">
                  {filteredTemplates.map((t) => (
                    <li
                      key={t}
                      onClick={() => addTemplate(t)}
                      className="px-3 py-2 cursor-pointer hover:bg-slate-800"
                    >
                      {t}
                    </li>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <li className="px-3 py-2 text-slate-400">No matches</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {workflows.map((w) => (
            <div
              key={w.id}
              className="relative rounded-2xl border border-slate-700/60 bg-slate-900/60 px-3 py-3"
            >
              {/* Remove button moved to top-right to save vertical space */}
              <button
                onClick={() => removeRow(w.id)}
                className="absolute right-3 top-3 text-rose-400 hover:text-rose-300 text-sm"
                aria-label={`Remove ${w.name}`}
              >
                Remove
              </button>

              {/* one-line grid that stays on a single line (wrap prevented) */}
              <div className="flex flex-wrap gap-3 items-center pr-16">
                <SelectField
                  label="Workflow name"
                  value={w.name}
                  onChange={(name) => up(w.id, { name })}
                  options={WORKFLOW_TEMPLATES as unknown as string[]}
                />
                <TinyNum label="Minutes per task" value={w.minPerTask} onChange={(v) => up(w.id, { minPerTask: v })} />
                <TinyNum label="Tasks per month" value={w.tasksPerMonth} onChange={(v) => up(w.id, { tasksPerMonth: v })} />
                <TinyNum label="People" value={w.people} onChange={(v) => up(w.id, { people: v })} />
                <TinyNum label="Automation %" value={w.automationPct} onChange={(v) => up(w.id, { automationPct: v })} />
                <TinyNum label="Hourly $" value={w.hourly} onChange={(v) => up(w.id, { hourly: v })} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUMMARY + DISCLAIMER */}
      <section className="mt-6 rounded-3xl border border-slate-700/50 bg-slate-900/50 p-5">
        <details open className="rounded-2xl">
          <summary className="cursor-pointer text-xl font-semibold">Calculation Summary</summary>
          <div className="prose prose-invert max-w-none mt-4">
            <p>
              <strong>Benefit:</strong> We estimate a portion of repetitive work shifts from humans to AI agents, with
              adoption ramping over time. Hours saved are based on: <em>employees × minutes per task × tasks per month × automation % × adoption % × 12 months</em>.
              This reflects productivity gains from reduced manual effort and faster completion.
            </p>
            <p>
              <strong>Program Cost:</strong> Includes monthly platform costs, AI usage fees, and a one-time implementation
              cost, amortized across the selected number of months.
            </p>
            <p>
              <strong>Net Impact:</strong> Net benefit equals annual labor savings minus total annual costs. ROI % is
              <em> net benefit ÷ total annual costs</em>.
            </p>
          </div>
        </details>

        <p className="mt-4 text-slate-400 text-sm leading-relaxed border-t border-slate-700/50 pt-4">
          The results of this calculator are provided for illustrative purposes only to help you explore potential benefits of AI automation in your
          organization. Actual outcomes will vary and are not a guarantee or commitment of financial return. Results depend on factors including but
          not limited to implementation practices, user adoption, workflow design and configurations, organizational processes, market conditions,
          and external economic factors. All calculations are presented in US dollars unless otherwise noted.
        </p>
      </section>
    </div>
  );
}

// ---------- UI bits ----------
function Kpi(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-5">
      <div className="text-sm font-semibold text-slate-300">{props.title}</div>
      <div className="mt-1 text-3xl md:text-4xl font-extrabold text-slate-50">{props.children}</div>
      {props.subtitle && <div className="text-xs text-slate-400 mt-1">{props.subtitle}</div>}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-2xl bg-slate-800/60 p-3">
      <span className="text-xs text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-slate-400">{prefix}</span>}
        <input
          inputMode="numeric"
          className="w-full rounded-xl bg-slate-900/60 px-3 py-2 outline-none border border-slate-700"
          value={String(value)}
          onChange={(e) => onChange(safeParse(e.target.value))}
        />
      </div>
    </label>
  );
}

function TinyNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-slate-400">{label}</span>
      <input
        inputMode="numeric"
        className="w-[120px] rounded-xl bg-slate-800/70 px-3 py-2 outline-none border border-slate-700"
        value={String(value)}
        onChange={(e) => onChange(safeParse(e.target.value))}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-slate-400">{label}</span>
      <select
        className="w-[220px] rounded-xl bg-slate-800/70 px-3 py-2 outline-none border border-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function safeParse(v: string) {
  const cleaned = v.replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

