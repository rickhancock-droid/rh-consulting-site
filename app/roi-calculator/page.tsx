// app/roi-calculator/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ---------- constants ----------
const LOGO_PATH = "/Original on transparent.png"; // your logo in /public
const CALENDLY_URL = "https://calendly.com/rick-hancock-rhconsulting/30min";

// Workflow library (kept tight; we can expand later)
const WORKFLOW_TEMPLATES = [
  { name: "FAQ / info requests", minPerTask: 3, tasksPerMonth: 600 },
  { name: "Inbound email triage", minPerTask: 2, tasksPerMonth: 800 },
  { name: "Lead qualification", minPerTask: 5, tasksPerMonth: 400 },
  { name: "Ticket routing & tagging", minPerTask: 2, tasksPerMonth: 1200 },
  { name: "CRM data entry", minPerTask: 4, tasksPerMonth: 500 },
  { name: "Appointment scheduling", minPerTask: 3, tasksPerMonth: 300 },
];

type Workflow = {
  id: string;
  name: string;
  minPerTask: number;    // minutes per task (human today)
  tasksPerMonth: number;
  people: number;        // headcount impacted (defaults to globalEmployees)
  automationPct: number; // % of this workflow automated by agents
  hourly: number;        // loaded hourly cost
};

type ModeKey = "conservative" | "standard" | "optimal";

// Default assumptions per mode
const MODE_PRESETS: Record<ModeKey, { adoptionPct: number; automationPct: number; hourly: number }> = {
  conservative: { adoptionPct: 50, automationPct: 40, hourly: 40 },
  standard:     { adoptionPct: 70, automationPct: 60, hourly: 45 },
  optimal:      { adoptionPct: 85, automationPct: 75, hourly: 55 },
};

// ---------- helpers ----------
const fmtMoney = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtHours = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " hrs";
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const fteFromHours = (hours: number) => hours / 2080;

// ---------- component ----------
export default function RoiCalculatorPage() {
  // Global defaults
  const [mode, setMode] = useState<ModeKey>("standard");           // Conservative / Standard / Optimal
  const [globalEmployees, setGlobalEmployees] = useState<number>(100); // **Default 100** for SMB
  const [adoptionPct, setAdoptionPct] = useState<number>(MODE_PRESETS.standard.adoptionPct);
  const [hourlyDefault, setHourlyDefault] = useState<number>(MODE_PRESETS.standard.hourly);

  // Costs
  const [platformMonthly, setPlatformMonthly] = useState<number>(1200);
  const [aiUsageMonthly, setAiUsageMonthly] = useState<number>(800);
  const [implementationOneTime, setImplementationOneTime] = useState<number>(12000);
  const [amortMonths, setAmortMonths] = useState<number>(12);

  // Workflows
  const [rows, setRows] = useState<Workflow[]>([
    mkRow("FAQ / info requests"),
    mkRow("Inbound email triage"),
  ]);

  // Searchable dropdown
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Derived: rows but with mode defaults applied (automation/hourly fallback)
  const effectiveRows = useMemo(() => {
    const autoDefault = MODE_PRESETS[mode].automationPct;
    return rows.map((r) => ({
      ...r,
      automationPct: r.automationPct ?? autoDefault,
      hourly: r.hourly || hourlyDefault,
      people: r.people || globalEmployees,
    }));
  }, [rows, mode, hourlyDefault, globalEmployees]);

  // Re-apply adoption/hourly when mode changes
  useEffect(() => {
    const p = MODE_PRESETS[mode];
    setAdoptionPct(p.adoptionPct);
    setHourlyDefault(p.hourly);
    // do not mutate existing rows—hourly stays editable; default only fills blanks
  }, [mode]);

  // ---------- calculations ----------
  const calc = useMemo(() => {
    // Hours & savings per workflow
    const wf = effectiveRows.map((r) => {
      const hours =
        (r.people * (r.minPerTask / 60) * r.tasksPerMonth) *
        (r.automationPct / 100) *
        (adoptionPct / 100) *
        12;
      const dollars = hours * r.hourly;
      return { ...r, hours, dollars };
    });

    const annualHours = wf.reduce((a, b) => a + b.hours, 0);
    const annualLaborSavings = wf.reduce((a, b) => a + b.dollars, 0);

    const annualPlatform = platformMonthly * 12;
    const annualAiUsage = aiUsageMonthly * 12;
    const annualImpl = amortMonths > 0 ? implementationOneTime * (12 / amortMonths) : implementationOneTime;
    const totalAnnualCosts = annualPlatform + annualAiUsage + annualImpl;

    const netBenefit = annualLaborSavings - totalAnnualCosts;
    const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : 0;

    return {
      wf,
      annualHours,
      annualLaborSavings,
      totalAnnualCosts,
      netBenefit,
      roiPct,
      fteSaved: fteFromHours(annualHours),
    };
  }, [effectiveRows, adoptionPct, platformMonthly, aiUsageMonthly, implementationOneTime, amortMonths]);

  // ---------- PDF Export ----------
  const pdfRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const node = pdfRef.current;
      if (!node) return;

      // Make sure the search dropdown is closed for clean capture
      setSearchOpen(false);

      // Render the node to canvas
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();

      // Fit the image to full page width
      const imgW = pageW - 64; // 32pt margins
      const imgH = (canvas.height * imgW) / canvas.width;

      let y = 32;

      // Header with logo + title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("RH Consulting — ROI Results", 32, y);
      // Logo (best if it’s visible on the page; here we add a small header logo)
      try {
        const logo = await (await fetch(LOGO_PATH)).blob();
        const buf = await logo.arrayBuffer();
        const base64Logo = `data:image/png;base64,${arrayBufferToBase64(buf)}`;
        pdf.addImage(base64Logo, "PNG", pageW - 120, y - 16, 88, 28);
      } catch {
        // ignore logo fetch errors
      }
      y += 16;

      // Main screenshot
      y += 16;
      pdf.addImage(imgData, "PNG", 32, y, imgW, imgH);
      y += imgH + 24;

      // Case Study 1 (append)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Case Study 1 — Boosting Online Visibility", 32, y);
      y += 18;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const cs1 =
        "Challenge: A mid-sized hospitality brand struggled with low website visibility and inconsistent content output.\n" +
        "Solution: Implemented data refinery pipelines and AI agents for SEO content drafting, metadata enrichment, and internal linking recommendations.\n" +
        "Outcome: +58% organic traffic in 90 days, +31% lead form conversions, and reduced content production cycle time by ~45%.\n\n" +
        "Why it matters: This shows how agentic automation compounds across workflows—content, ops, and support—amplifying ROI.";
      wrapText(pdf, cs1, 32, pageW - 64, y, 16);
      y += 4 + ((cs1.match(/\n/g) || []).length + 1) * 16;

      // Disclaimer (short form for PDF)
      y += 12;
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      const disclaimer =
        "Disclaimer: The results of this calculator are illustrative only and not a guarantee of financial return. Outcomes vary by implementation, adoption, configurations, and external factors. All values shown in USD.";
      wrapText(pdf, disclaimer, 32, pageW - 64, y, 14);

      pdf.save("ROI Results.pdf");
    } catch (e) {
      console.error(e);
      alert("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ---------- UI ----------
  // close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const dd = document.getElementById("workflow-dd");
      if (dd && !dd.contains(target)) setSearchOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return WORKFLOW_TEMPLATES;
    return WORKFLOW_TEMPLATES.filter((t) => t.name.toLowerCase().includes(q));
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" ref={pdfRef}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              AI ROI Calculator
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Defaults reflect a ~100-employee California SMB—adjust as needed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={CALENDLY_URL}
              className="inline-flex items-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-4 py-2 text-sm shadow"
            >
              Book a call with these results
            </Link>
            <button
              onClick={exportPDF}
              disabled={exporting}
              className="inline-flex items-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 text-sm shadow disabled:opacity-50"
              title="Download your inputs and results as a PDF"
            >
              {exporting ? "Preparing PDF…" : "ROI Results PDF"}
            </button>
          </div>
        </div>

        {/* Mode & global settings */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">Assumption mode:</label>
            <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
              {(["conservative","standard","optimal"] as ModeKey[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 text-sm ${mode === m ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-transparent"}`}
                  aria-pressed={mode === m}
                >
                  {capitalize(m)}
                </button>
              ))}
            </div>
          </div>

          <NumberField
            label="Employees impacted"
            value={globalEmployees}
            onChange={(v) => setGlobalEmployees(clamp(v, 1, 100000))}
            min={1}
            step={1}
          />

          <NumberField
            label="Default hourly cost (California SMB)"
            value={hourlyDefault}
            onChange={(v) => setHourlyDefault(clamp(v, 10, 500))}
            min={10}
            step={1}
            help="$45/hr typical; override if needed"
          />
        </div>

        {/* Results dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Annual hours saved" value={fmtHours(calc.annualHours)} />
          <KpiCard label="Annual labor savings" value={fmtMoney(calc.annualLaborSavings)} />
          <KpiCard label="Total annual costs" value={fmtMoney(calc.totalAnnualCosts)} />
          <div className="rounded-2xl p-4 border shadow-sm bg-gradient-to-br from-orange-500 to-amber-500 text-white">
            <div className="text-sm opacity-90">Net benefit & ROI</div>
            <div className="mt-1 text-2xl font-semibold">{fmtMoney(calc.netBenefit)}</div>
            <div className="mt-1 text-lg font-semibold text-emerald-100">
              ROI {Math.round(calc.roiPct)}%
            </div>
          </div>
        </div>

        {/* Program costs */}
        <Section title="Program costs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <NumberField label="Platform cost / mo" value={platformMonthly} onChange={setPlatformMonthly} min={0} step={100} />
            <NumberField label="AI usage / mo" value={aiUsageMonthly} onChange={setAiUsageMonthly} min={0} step={100} />
            <NumberField label="Implementation (one-time)" value={implementationOneTime} onChange={setImplementationOneTime} min={0} step={500} />
            <NumberField label="Amortize over (months)" value={amortMonths} onChange={(v)=>setAmortMonths(clamp(v,1,36))} min={1} step={1} />
          </div>
        </Section>

        {/* Workflows */}
        <Section title="Workflows">
          {/* Add from templates (searchable) */}
          <div className="relative mb-3" id="workflow-dd">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              + Add from templates (search)
            </button>
            {searchOpen && (
              <div className="absolute z-10 mt-2 w-full max-w-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
                <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                  <input
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search workflows…"
                    className="w-full bg-transparent outline-none px-2 py-1 text-sm"
                  />
                </div>
                <ul className="max-h-64 overflow-auto py-1">
                  {filteredTemplates.map((t) => (
                    <li key={t.name}>
                      <button
                        onClick={() => {
                          addTemplate(t.name);
                          setSearchOpen(false);
                          setSearchTerm("");
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
                      >
                        {t.name}
                      </button>
                    </li>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                {/* compact top row with Remove */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <input
                    value={r.name}
                    onChange={(e) => updateRow(r.id, { name: e.target.value })}
                    className="flex-1 bg-transparent outline-none text-sm font-medium"
                  />
                  <button
                    onClick={() => removeRow(r.id)}
                    className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Remove
                  </button>
                </div>

                {/* inputs single-line on wide screens */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <NumberField label="Minutes per task" value={r.minPerTask} onChange={(v)=>updateRow(r.id,{minPerTask: clamp(v,0,180)})} min={0} step={1} />
                  <NumberField label="Tasks / month" value={r.tasksPerMonth} onChange={(v)=>updateRow(r.id,{tasksPerMonth: clamp(v,0,1000000)})} min={0} step={10} />
                  <NumberField label="Employees" value={r.people} onChange={(v)=>updateRow(r.id,{people: clamp(v,0,100000)})} min={0} step={1} />
                  <NumberField label="Automation %" value={r.automationPct} onChange={(v)=>updateRow(r.id,{automationPct: clamp(v,0,100)})} min={0} step={5} />
                  <NumberField label="Hourly $" value={r.hourly} onChange={(v)=>updateRow(r.id,{hourly: clamp(v,0,1000)})} min={0} step={1} />
                </div>
              </div>
            ))}
          </div>

          {/* Add new custom workflow */}
          <div className="mt-3">
            <button
              onClick={() => setRows((prev) => [...prev, mkRow("Custom workflow")])}
              className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              + Add workflow
            </button>
          </div>
        </Section>

        {/* Calculation Summary (approved copy) */}
        <Details title="Calculation Summary" defaultOpen={false}>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            <strong>Benefit:</strong> We estimate a portion of repetitive work shifts from humans to AI agents, with adoption ramping over time.
            Hours saved are based on: employees × minutes per task × tasks per month × automation % × adoption % × 12 months.
            This reflects productivity gains from reduced manual effort and faster completion.
          </p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300 mt-3">
            <strong>Program Cost:</strong> Includes monthly platform costs, AI usage fees, and a one-time implementation cost, amortized across the selected number of months.
          </p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300 mt-3">
            <strong>Net Impact:</strong> Net benefit equals annual labor savings minus total annual costs. ROI % is net benefit ÷ total annual costs.
          </p>
        </Details>

        {/* On-page disclaimer (short form, always visible) */}
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          The results of this calculator are provided for illustrative purposes only to help you explore potential benefits of AI automation in your organization.
          Actual outcomes will vary and are not a guarantee or commitment of financial return. Results depend on factors including but not limited to
          implementation practices, user adoption, workflow design and configurations, organizational processes, market conditions, and external economic factors.
          All calculations are presented in US dollars unless otherwise noted.
        </div>
      </div>
    </div>
  );

  // ------ helpers (component scope) ------
  function addTemplate(name: string) {
    const t = WORKFLOW_TEMPLATES.find((x) => x.name === name);
    if (!t) return;
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: t.name,
        minPerTask: t.minPerTask,
        tasksPerMonth: t.tasksPerMonth,
        people: globalEmployees,
        automationPct: MODE_PRESETS[mode].automationPct,
        hourly: hourlyDefault,
      },
    ]);
  }

  function updateRow(id: string, patch: Partial<Workflow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function mkRow(name: string): Workflow {
    return {
      id: crypto.randomUUID(),
      name,
      minPerTask: 3,
      tasksPerMonth: 300,
      people: globalEmployees,
      automationPct: MODE_PRESETS[mode].automationPct,
      hourly: hourlyDefault,
    };
  }
}

// ---------- small components ----------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </section>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <div className="text-sm text-slate-600 dark:text-slate-300">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  help?: string;
}) {
  const { label, value, onChange, min = 0, step = 1, help } = props;
  return (
    <label className="block">
      <div className="text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">{label}</div>
      <input
        inputMode="decimal"
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, "");
          const num = raw === "" ? 0 : Number(raw);
          if (!Number.isNaN(num)) onChange(num);
        }}
        onBlur={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, "");
          const num = raw === "" ? 0 : Number(raw);
          if (!Number.isNaN(num)) onChange(Math.max(min, num));
        }}
        step={step}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
      />
      {help && <div className="mt-1 text-xs text-slate-500">{help}</div>}
    </label>
  );
}

function Details({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-medium">{title}</span>
        <span className="text-slate-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ---------- misc utils ----------
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
