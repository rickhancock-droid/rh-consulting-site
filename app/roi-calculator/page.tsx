"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ---------- constants ----------
const CALENDLY_URL = "https://calendly.com/rick-hancock-rhconsulting/30min";
const LOGO_PATH = "/Original on transparent.png"; // put your logo in /public

{/* === Settings / Assumption Mode + Adoption + Costs === */}
<section className="mt-8 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
  {/* Presets row w/ slider embedded between Conservative & Typical */}
  <div className="flex flex-wrap items-center gap-3 md:gap-4">
    {/* Conservative pill */}
    <button
      type="button"
      onClick={() => setMode("conservative")}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
        mode === "conservative"
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
          : "bg-white text-slate-900 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
      }`}
    >
      {MODES.conservative.label}
    </button>

    {/* Adoption slider (between Conservative and Typical) */}
    <div className="flex items-center gap-3">
      <input
        type="range"
        aria-label="Adoption (% of eligible work)"
        min={0}
        max={100}
        step={5}
        value={adoption}
        onChange={(e) => setAdoption(parseInt(e.target.value, 10))}
        className="w-44 md:w-56 accent-emerald-500"
      />
      <span className="text-sm text-slate-700 dark:text-slate-300">
        Adoption: <span className="font-semibold">{adoption}%</span>
      </span>
    </div>

    {/* Typical pill */}
    <button
      type="button"
      onClick={() => setMode("typical")}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
        mode === "typical"
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
          : "bg-white text-slate-900 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
      }`}
    >
      {MODES.typical.label}
    </button>

    {/* Optimal pill */}
    <button
      type="button"
      onClick={() => setMode("optimal")}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
        mode === "optimal"
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
          : "bg-white text-slate-900 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
      }`}
    >
      {MODES.optimal.label}
    </button>
  </div>

  {/* 5-input row (desktop = single line) */}
  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
    {/* Employees */}
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Employees</span>
      <input
        type="number"
        min={1}
        step={1}
        value={employees}
        onChange={(e) => setEmployees(Math.max(1, parseInt(e.target.value || "0", 10)))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>

    {/* Platform monthly */}
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Platform ($/mo)</span>
      <input
        type="number"
        min={0}
        step={10}
        value={platformMonthly}
        onChange={(e) => setPlatformMonthly(Math.max(0, parseInt(e.target.value || "0", 10)))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>

    {/* AI usage monthly */}
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">AI Usage ($/mo)</span>
      <input
        type="number"
        min={0}
        step={10}
        value={aiUsageMonthly}
        onChange={(e) => setAiUsageMonthly(Math.max(0, parseInt(e.target.value || "0", 10)))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>

    {/* Implementation (one-time) */}
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Implementation (one-time)</span>
      <input
        type="number"
        min={0}
        step={100}
        value={implOneTime}
        onChange={(e) => setImplOneTime(Math.max(0, parseInt(e.target.value || "0", 10)))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>

    {/* Amortization months */}
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Amortization (months)</span>
      <input
        type="number"
        min={1}
        step={1}
        value={amortMonths}
        onChange={(e) => setAmortMonths(Math.max(1, parseInt(e.target.value || "0", 10)))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>
  </div>
</section>

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

// ---------- helpers ----------
const fmtMoney = (n: number, currency: string = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

const fmtInt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const fteFromHours = (hours: number) => hours / 2080; // ≈ 2080 hrs/yr

const uid = () => Math.random().toString(36).slice(2, 8);

// ---------- component ----------
export default function RoiCalculatorPage() {
  // --- Assumption mode + adoption (single source of truth) ---
  type Mode = "conservative" | "typical" | "optimal";

  const MODES: Record<Mode, { label: string; adoptionPct: number }> = {
    conservative: { label: "Conservative", adoptionPct: 60 },
    typical:      { label: "Typical",      adoptionPct: 70 },
    optimal:      { label: "Optimal",      adoptionPct: 85 },
  };

  const [mode, setMode] = useState<Mode>("typical");           // default: Typical (70%)
  const [adoption, setAdoption] = useState<number>(MODES.typical.adoptionPct);

  // Keep adoption synced with selected mode
  useEffect(() => {
    setAdoption(MODES[mode].adoptionPct);
  }, [mode]);

  // --- program-level inputs (do NOT redeclare mode/adoption below) ---
  const [employees, setEmployees] = useState<number>(100); // SMB baseline
  const [platformMonthly, setPlatformMonthly] = useState<number>(500);
  const [aiUsageMonthly, setAiUsageMonthly] = useState<number>(300);
  const [implOneTime, setImplOneTime] = useState<number>(3000);
  const [amortMonths, setAmortMonths] = useState<number>(12);

// Workflows
const [rows, setRows] = useState<Workflow[]>([
  {
    id: uid(),
    name: "FAQ / info requests",
    minPerTask: 3,
    tasksPerMonth: 800,
    people: 2,
    automationPct: 60,
    hourly: 45,
  },
  {
    id: uid(),
    name: "Lead qualification",
    minPerTask: 6,
    tasksPerMonth: 400,
    people: 2,
    automationPct: 55,
    hourly: 45,
  },
]);

  // Searchable template dropdown state
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");

  // Derived calculations
  const {
    annualHours,
    annualLaborSavings,
    annualCosts,
    netBenefit,
    roiPct,
    wfHours,
  } = useMemo(() => {
    const wfHours = rows.map((r) => {
      const hrs =
        (r.minPerTask / 60) * // minutes to hours
        r.tasksPerMonth *
        12 *
        (r.automationPct / 100) *
        (adoption / 100);
      return {
        id: r.id,
        hours: hrs,
        dollars: hrs * r.hourly,
        name: r.name,
        minPerTask: r.minPerTask,
        tasksPerMonth: r.tasksPerMonth,
        people: r.people,
        automationPct: r.automationPct,
        hourly: r.hourly,
      };
    });

    const annualHours = wfHours.reduce((a, b) => a + b.hours, 0);
    const annualLaborSavings = wfHours.reduce((a, b) => a + b.dollars, 0);

    const annualizedImpl = implOneTime / Math.max(1, amortMonths);
    const annualCosts = platformMonthly * 12 + aiUsageMonthly * 12 + annualizedImpl;

    const netBenefit = annualLaborSavings - annualCosts;
    const roiPct = annualCosts > 0 ? (netBenefit / annualCosts) * 100 : 0;

    return { annualHours, annualLaborSavings, annualCosts, netBenefit, roiPct, wfHours };
  }, [rows, adoption, platformMonthly, aiUsageMonthly, implOneTime, amortMonths]);

  // PDF section refs
  const pageRef = useRef<HTMLDivElement>(null);

  // ---------- actions ----------
  const addRow = (name = "") =>
    setRows((prev) => [
      ...prev,
      {
        id: uid(),
        name,
        minPerTask: 5,
        tasksPerMonth: 500,
        people: 1,
        automationPct: 50,
        hourly: 45,
      },
    ]);

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id: string, patch: Partial<Workflow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const filteredTemplates = WORKFLOW_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(templateQuery.toLowerCase())
  );

  // HTML → PDF with theme-aware styling and full content (logo, summary, glossary, CS1, disclaimer)
  async function downloadPdf() {
    if (!pageRef.current) return;

    // Detect current theme from document (tailwind dark class)
    const isDark = document.documentElement.classList.contains("dark");

    const canvas = await html2canvas(pageRef.current, {
      backgroundColor: isDark ? "#0b1220" : "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    let y = 40;

    // Header with logo
    if (LOGO_PATH) {
      try {
        const logoImg = await (await fetch(LOGO_PATH)).blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise((res) => {
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(logoImg);
        });
        pdf.addImage(dataUrl, "PNG", 40, y, 120, 40);
      } catch {/* ignore logo errors */}
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("AI Agent ROI Calculator (Digital Labor) — ROI Results", 40, y + 60);

    // Key results line
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    const line1 =
      `Annual Hours Saved: ${fmtInt(annualHours)}  |  ` +
      `Annual Labor Savings: ${fmtMoney(annualLaborSavings)}  |  ` +
      `Total Annual Costs: ${fmtMoney(annualCosts)}  |  ` +
      `Net Benefit: ${fmtMoney(netBenefit)}  |  ROI: ${fmtInt(roiPct)}%`;
    wrapText(pdf, line1, 40, pageW - 80, (y += 80), 16);
    y += 12;

    // Calculation Summary
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Calculation Summary", 40, (y += 24));
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    const calcSummary =
      "Benefit: We estimate a portion of repetitive work shifts from humans to AI agents, with adoption ramping over time. " +
      "Hours saved are based on: employees × minutes per task × tasks per month × automation % × adoption % × 12 months. " +
      "This reflects productivity gains from reduced manual effort and faster completion.\n\n" +
      "Program Cost: Includes monthly platform costs, AI usage fees, and a one-time implementation cost, amortized across the selected number of months.\n\n" +
      "Net Impact: Net benefit equals annual labor savings minus total annual costs. ROI % is net benefit ÷ total annual costs.";
    y = wrapText(pdf, calcSummary, 40, pageW - 80, y + 10, 16);

    // Insert the page screenshot (full calculator) scaled below summary
    const imgW = pageW - 80;
    const imgH = (canvas.height * imgW) / canvas.width;
    if (y + imgH > pageH - 80) {
      pdf.addPage();
      y = 40;
    }
    pdf.addImage(imgData, "PNG", 40, (y += 20), imgW, imgH);
    y += imgH;

    // New page for Case Study & Glossary & Disclaimer if needed
    pdf.addPage();
    y = 40;

    // Case Study 1 (default)
    const cs = CASE_STUDIES[1];
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(cs.title, 40, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    y = wrapText(pdf, `Client: ${cs.client}`, 40, pageW - 80, (y += 18));
    y = wrapText(pdf, `Problem: ${cs.problem}`, 40, pageW - 80, (y += 14));
    y = wrapText(pdf, `Solution: ${cs.solution}`, 40, pageW - 80, (y += 14));
    y = wrapText(pdf, `Outcome: ${cs.outcome}`, 40, pageW - 80, (y += 14));
    y = wrapText(pdf, `Why it matters: ${cs.why}`, 40, pageW - 80, (y += 14));

    // Glossary (appendix)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Appendix — Glossary (selected terms)", 40, (y += 28));
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    for (const g of PDF_GLOSSARY) {
      y = wrapText(pdf, `• ${g.term}: ${g.def}`, 40, pageW - 80, (y += 16));
      if (y > pageH - 80) {
        pdf.addPage();
        y = 40;
      }
    }

    // Disclaimer (short form)
    const disclaimer =
      "Disclaimer: The results of this calculator are provided for illustrative purposes only to help you explore potential benefits of AI automation in your organization. " +
      "Actual outcomes will vary and are not a guarantee or commitment of financial return. Results depend on factors including but not limited to implementation practices, " +
      "user adoption, workflow design and configurations, organizational processes, market conditions, and external economic factors. All calculations are presented in US dollars unless otherwise noted.";
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Disclaimer", 40, (y += 28));
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    wrapText(pdf, disclaimer, 40, pageW - 80, (y += 12), 16);

    pdf.save("ROI Results.pdf");
  }

  // PDF helper (wrap text to width and return next y)
  function wrapText(
    pdf: jsPDF,
    text: string,
    x: number,
    maxWidth: number,
    y: number,
    lineHeight = 16
  ) {
    const lines = pdf.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      pdf.text(line, x, y);
      y += lineHeight;
    }
    return y;
  }

  // ---------- UI ----------
  return (
    <main ref={pageRef} className="mx-auto max-w-6xl px-4 py-8">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agent ROI Calculator <span className="text-orange-500">(Digital Labor)</span></h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Defaults reflect a ~100-employee SMB — tweak for your org.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            href={CALENDLY_URL}
            target="_blank"
          >
            Book a Call with These Results
          </Link>
          <button
            onClick={downloadPdf}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            aria-label="Download ROI Results PDF"
          >
            ROI Results PDF
          </button>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashCard label="Annual Hours Saved" value={`${fmtInt(annualHours)} hrs`} />
        <DashCard label="Annual Labor Savings" value={fmtMoney(annualLaborSavings)} />
        <DashCard label="Total Annual Costs" value={fmtMoney(annualCosts)} />
        <DashCard
          label="Net Benefit & ROI"
          value={`${fmtMoney(netBenefit)}  •  ${fmtInt(roiPct)}%`}
          accent
        />
      </div>

{/* Assumptions + Adoption mode */}
<section className="mt-8 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
  {/* Preset pills + adoption slider (all on one row) */}
  <div className="flex flex-wrap items-center gap-3">
    <ModePill
      label={MODES.conservative.label}
      active={mode === "conservative"}
      onClick={() => setMode("conservative")}
    />
    <ModePill
      label={MODES.typical.label}
      active={mode === "typical"}
      onClick={() => setMode("typical")}
    />
    <ModePill
      label={MODES.optimal.label}
      active={mode === "optimal"}
      onClick={() => setMode("optimal")}
    />

    {/* Adoption slider sits at the far right of the row */}
    <div className="ml-auto flex items-center gap-3">
      <input
        type="range"
        aria-label="Adoption (% of eligible work)"
        min={0}
        max={100}
        step={5}
        value={adoption}
        onChange={(e) => setAdoption(parseInt(e.target.value, 10))}
        className="w-44 md:w-56 accent-emerald-500"
      />
      <div className="text-sm text-slate-600 dark:text-slate-300">
        Adoption: <span className="font-semibold">{adoption}%</span>
      </div>
    </div>
  </div>

  {/* 5-input row (single line on wide screens) */}
  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <NumField
      label="Employees"
      value={employees}
      onChange={(v) => setEmployees(v)}
      min={1}
    />
    <NumField
      label="Platform Cost (monthly)"
      value={platformMonthly}
      onChange={(v) => setPlatformMonthly(v)}
      min={0}
      prefix="$"
    />
    <NumField
      label="AI Usage (monthly)"
      value={aiUsageMonthly}
      onChange={(v) => setAiUsageMonthly(v)}
      min={0}
      prefix="$"
    />
    <NumField
      label="Implementation (one-time)"
      value={implOneTime}
      onChange={(v) => setImplOneTime(v)}
      min={0}
      prefix="$"
    />
  </div>
</section>

// ---------- small UI bits ----------
type DashCardProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function DashCard({ label, value, accent }: DashCardProps) {
  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (accent
          ? "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-200"
          : "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100")
      }
    >
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function ModePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-sm " +
        (active
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700")
      }
    >
      {label}
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={"block " + className}>
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
      />
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  className = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <label className={"block " + className}>
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          const n = raw === "" ? 0 : parseInt(raw, 10);
          const clamped = clamp(n, min ?? Number.MIN_SAFE_INTEGER, max ?? Number.MAX_SAFE_INTEGER);
          onChange(clamped);
        }}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
      />
    </label>
  );
}
