"use client";
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * rhconsulting.ai — ROI Calculators (Clean Start)
 * - Automation calculator (multi-workflow)
 * - Support calculator (deflection + AHT reduction)
 * - Top-of-page CTA under summary grids + bottom lead section
 * - Dynamic scheduler link carries ROI numbers via query params
 * - Email (mailto) summary + CSV export (automation)
 *
 * Drop this single file into your React/Next.js app and render <ROIPage/>.
 */

// ------------------ Helpers ------------------
const currencyFmt = (n: number, currency: string = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);
const num1 = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(isFinite(n) ? n : 0);

const SCHEDULER_URL = "https://calendly.com/rick-hancock-rhconsulting/30min"; // <-- replace with your real link
const HOURS_PER_FTE = 2080;

function buildURL(base: string, params: Record<string, string | number>) {
  const q = new URLSearchParams(Object.entries(params).reduce((acc: Record<string,string>, [k,v]) => { acc[k] = String(v); return acc; }, {}));
  return `${base}?${q.toString()}`;
}

// ------------------ Types ------------------
interface TaskRow {
  id: string;
  name: string;
  minutesPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationRate: number; // % automated by agent
  hourlyCost: number; // loaded cost
}

interface AutomationCosts {
  monthlyPlatformCost: number;
  monthlyAIUsageCost: number;
  implementationCost: number; // one-time
  implementationAmortizationMonths: number; // spread over N months
}

interface AutomationResults {
  rows: (TaskRow & { hoursSaved: number; laborSavings: number })[];
  totalHoursSaved: number;

  totalLaborSavings: number;
  fteSaved: number;
  annualPlatformCost: number;
  annualAIUsageCost: number;
  annualizedImplementation: number;
  totalAnnualCosts: number;
  netBenefit: number;
  roiPct: number;
  paybackMonths: number; // Infinity when no savings
}

interface SupportInputs { monthlyTickets: number; currentAHT: number; deflectionRate: number; ahtReductionRate: number; hourlyCost: number; }
interface SupportResults {
  deflectedTickets: number;
  residualTickets: number;
  minutesSavedFromDeflection: number;
  minutesSavedFromAHT: number;
  totalHoursSaved: number; // annualized
  totalLaborSavings: number; // annualized
  annualPlatformCost: number;
  annualAIUsageCost: number;
  annualizedImplementation: number;
  totalAnnualCosts: number;
  netBenefit: number;
  roiPct: number;
  paybackMonths: number;
}

// ------------------ Calculation hooks ------------------
function useAutomationResults(tasks: TaskRow[], adoptionRate: number, costs: AutomationCosts): AutomationResults {
  return useMemo(() => {
    const rows = tasks.map((t) => {
      const hoursSaved = (t.minutesPerTask / 60) * t.tasksPerMonth * t.people * (t.automationRate / 100) * (adoptionRate / 100);
      const laborSavings = hoursSaved * t.hourlyCost;
      return { ...t, hoursSaved, laborSavings };
    });

    const totalHoursSaved = rows.reduce((a, r) => a + r.hoursSaved, 0);
    const totalLaborSavings = rows.reduce((a, r) => a + r.laborSavings, 0);
    const fteSaved = totalHoursSaved / HOURS_PER_FTE;

    const annualPlatformCost = costs.monthlyPlatformCost * 12;
    const annualAIUsageCost = costs.monthlyAIUsageCost * 12;
    const annualizedImplementation = (costs.implementationCost / Math.max(1, costs.implementationAmortizationMonths)) * 12;
    const totalAnnualCosts = annualPlatformCost + annualAIUsageCost + annualizedImplementation;

    const netBenefit = totalLaborSavings - totalAnnualCosts;
    const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : 0;
    const paybackMonths = totalLaborSavings > 0 ? totalAnnualCosts / (totalLaborSavings / 12) : Infinity;

    return { rows, totalHoursSaved, totalLaborSavings, fteSaved, annualPlatformCost, annualAIUsageCost, annualizedImplementation, totalAnnualCosts, netBenefit, roiPct, paybackMonths };
  }, [tasks, adoptionRate, costs]);
}

function useSupportResults(inputs: SupportInputs, costs: AutomationCosts): SupportResults {
  return useMemo(() => {
    const deflectedTickets = inputs.monthlyTickets * (inputs.deflectionRate / 100);
    const residualTickets = inputs.monthlyTickets - deflectedTickets;

    const minutesSavedFromDeflection = deflectedTickets * inputs.currentAHT;
    const minutesSavedFromAHT = residualTickets * inputs.currentAHT * (inputs.ahtReductionRate / 100);

    const totalMonthlyMinutesSaved = minutesSavedFromDeflection + minutesSavedFromAHT;
    const totalHoursSavedAnnual = (totalMonthlyMinutesSaved / 60) * 12;
    const totalLaborSavings = totalHoursSavedAnnual * inputs.hourlyCost;

    const annualPlatformCost = costs.monthlyPlatformCost * 12;
    const annualAIUsageCost = costs.monthlyAIUsageCost * 12;
    const annualizedImplementation = (costs.implementationCost / Math.max(1, costs.implementationAmortizationMonths)) * 12;
    const totalAnnualCosts = annualPlatformCost + annualAIUsageCost + annualizedImplementation;

    const netBenefit = totalLaborSavings - totalAnnualCosts;
    const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : 0;
    const paybackMonths = totalLaborSavings > 0 ? totalAnnualCosts / (totalLaborSavings / 12) : Infinity;

    return {
      deflectedTickets,
      residualTickets,
      minutesSavedFromDeflection,
      minutesSavedFromAHT,
      totalHoursSaved: totalHoursSavedAnnual,
      totalLaborSavings,
      annualPlatformCost,
      annualAIUsageCost,
      annualizedImplementation,
      totalAnnualCosts,
      netBenefit,
      roiPct,
      paybackMonths,
    };
  }, [inputs, costs]);
}

// ------------------ Child UI Components ------------------
function AutomationCalculator({
  currencyCode,
  tasks,
  setTasks,
  adoptionRate,
  setAdoptionRate,
  costs,
  setCosts,
  results,
  schedulerHref,
}: {
  currencyCode: string;
  tasks: TaskRow[];
  setTasks: React.Dispatch<React.SetStateAction<TaskRow[]>>;
  adoptionRate: number;
  setAdoptionRate: (n: number) => void;
  costs: AutomationCosts;
  setCosts: (patch: Partial<AutomationCosts>) => void;
  results: AutomationResults;
  schedulerHref: string;
}) {
  const addRow = () => setTasks((prev) => [
    ...prev,
    { id: crypto.randomUUID(), name: "New workflow", minutesPerTask: 4, tasksPerMonth: 400, people: 1, automationRate: 50, hourlyCost: 40 },
  ]);
  const removeRow = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const updateRow = (id: string, patch: Partial<TaskRow>) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const downloadCSV = () => {
    const headers = ["Task","Minutes per Task","Tasks per Month","People","Automation %","Hourly Cost","Hours Saved/yr","Labor Savings/yr"];
    const rowsCsv = results.rows.map((r) => [r.name, r.minutesPerTask, r.tasksPerMonth, r.people, r.automationRate, r.hourlyCost, r.hoursSaved.toFixed(1), r.laborSavings.toFixed(0)].join(",")).join("\n");
    const totals = `Totals,,,,,,${results.totalHoursSaved.toFixed(1)},${results.totalLaborSavings.toFixed(0)}`;
    const csv = [headers.join(","), rowsCsv, totals].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "automation-roi.csv"; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Automation – ROI Calculator</h2>
          <p className="text-slate-600">Estimate hours saved, labor savings, payback, and ROI across workflows.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addRow} className="px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700">+ Add Workflow</button>
          <button onClick={downloadCSV} className="px-4 py-2 rounded-2xl bg-slate-900 text-white hover:bg-black">Export CSV</button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <div>
          <label className="block text-sm font-medium mb-1">Adoption Rate (%)</label>
          <input type="range" min={10} max={100} step={5} value={adoptionRate} onChange={(e) => setAdoptionRate(Number(e.target.value))} className="w-full" />
          <div className="text-sm text-slate-600">{adoptionRate}% of eligible work uses agents</div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Monthly Platform Cost</label>
          <input type="number" value={costs.monthlyPlatformCost} onChange={(e) => setCosts({ monthlyPlatformCost: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          <div className="text-xs text-slate-500">Subscriptions/tools</div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Monthly AI Usage Cost</label>
          <input type="number" value={costs.monthlyAIUsageCost} onChange={(e) => setCosts({ monthlyAIUsageCost: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          <div className="text-xs text-slate-500">Model/API spend</div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Implementation (one-time)</label>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={costs.implementationCost} onChange={(e) => setCosts({ implementationCost: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
            <input type="number" min={1} value={costs.implementationAmortizationMonths} onChange={(e) => setCosts({ implementationAmortizationMonths: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
          <div className="text-xs text-slate-500">Spread cost over N months</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">Task / Workflow</th>
                <th className="p-3 text-left">Min / Task</th>
                <th className="p-3 text-left">Tasks / Month</th>
                <th className="p-3 text-left">People</th>
                <th className="p-3 text-left">Automation %</th>
                <th className="p-3 text-left">Hourly Cost</th>
                <th className="p-3 text-right">Hours Saved / yr</th>
                <th className="p-3 text-right">Labor Savings / yr</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {results.rows.map((r) => (
                  <motion.tr key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="border-b last:border-0">
                    <td className="p-3"><input value={r.name} onChange={(e)=>updateRow(r.id,{ name: e.target.value })} className="w-full border rounded-xl px-3 py-2"/></td>
                    <td className="p-3"><input type="number" min={0} value={r.minutesPerTask} onChange={(e)=>updateRow(r.id,{ minutesPerTask: Number(e.target.value) })} className="w-28 border rounded-xl px-3 py-2"/></td>
                    <td className="p-3"><input type="number" min={0} value={r.tasksPerMonth} onChange={(e)=>updateRow(r.id,{ tasksPerMonth: Number(e.target.value) })} className="w-32 border rounded-xl px-3 py-2"/></td>
                    <td className="p-3"><input type="number" min={0} value={r.people} onChange={(e)=>updateRow(r.id,{ people: Number(e.target.value) })} className="w-24 border rounded-xl px-3 py-2"/></td>
                    <td className="p-3"><input type="number" min={0} max={100} value={r.automationRate} onChange={(e)=>updateRow(r.id,{ automationRate: Number(e.target.value) })} className="w-28 border rounded-xl px-3 py-2"/></td>
                    <td className="p-3"><input type="number" min={0} value={r.hourlyCost} onChange={(e)=>updateRow(r.id,{ hourlyCost: Number(e.target.value) })} className="w-28 border rounded-xl px-3 py-2"/></td>
                    <td className="p-3 text-right">{num1(r.hoursSaved)} hrs</td>
                    <td className="p-3 text-right font-medium">{currencyFmt(r.laborSavings)}</td>
                    <td className="p-3 text-right"><button onClick={()=>removeRow(r.id)} className="text-slate-500 hover:text-red-600">Remove</button></td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl shadow-sm border"><div className="text-slate-500 text-sm">Annual Hours Saved</div><div className="text-3xl font-semibold">{num1(results.totalHoursSaved)}</div><div className="text-slate-500 text-sm">≈ {num1(results.fteSaved)} FTE</div></div>
        <div className="p-5 bg-white rounded-2xl shadow-sm border"><div className="text-slate-500 text-sm">Annual Labor Savings</div><div className="text-3xl font-semibold">{currencyFmt(results.totalLaborSavings)}</div><div className="text-slate-500 text-sm">before software costs</div></div>
        <div className="p-5 bg-white rounded-2xl shadow-sm border"><div className="text-slate-500 text-sm">Total Annual Costs</div><div className="text-3xl font-semibold">{currencyFmt(results.totalAnnualCosts)}</div><div className="text-slate-500 text-sm">platform + usage + build</div></div>
        <div className="p-5 bg-white rounded-2xl shadow-sm border"><div className="text-slate-500 text-sm">Net Benefit / ROI</div><div className="text-3xl font-semibold">{currencyFmt(results.netBenefit)}</div><div className={(results.roiPct>=0?"text-emerald-600":"text-red-600")+" text-sm"}>{isFinite(results.roiPct)?results.roiPct.toFixed(0):"—"}% ROI</div></div>
      </div>

      {/* Top CTA under summary grid */}
      <div className="flex justify-end mt-3">
        <a href={schedulerHref} target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700">Book a Call with These Results</a>
      </div>
    </div>
  );
}

function SupportCalculator({
  inputs,
  setInputs,
  costs,
  setCosts,
  results,
  schedulerHref,
}: {
  inputs: SupportInputs;
  setInputs: (patch: Partial<SupportInputs>) => void;
  costs: AutomationCosts;
  setCosts: (patch: Partial<AutomationCosts>) => void;
  results: SupportResults;
  schedulerHref: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Customer Support – ROI Calculator</h2>
          <p className="text-slate-600">Savings from ticket deflection and AHT reduction with AI agents.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <div>
          <label className="block text-sm font-medium mb-1">Monthly Tickets</label>
          <input type="number" value={inputs.monthlyTickets} onChange={(e) => setInputs({ monthlyTickets: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Current AHT (minutes)</label>
          <input type="number" value={inputs.currentAHT} onChange={(e) => setInputs({ currentAHT: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deflection Rate (%)</label>
          <input type="number" min={0} max={100} value={inputs.deflectionRate} onChange={(e) => setInputs({ deflectionRate: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">AHT Reduction on Residual (%)</label>
          <input type="number" min={0} max={100} value={inputs.ahtReductionRate} onChange={(e) => setInputs({ ahtReductionRate: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Platform Cost / mo</label>
          <input type="number" value={costs.monthlyPlatformCost} onChange={(e) => setCosts({ monthlyPlatformCost: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">AI Usage / mo</label>
          <input type="number" value={costs.monthlyAIUsageCost} onChange={(e) => setCosts({ monthlyAIUsageCost: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Implementation ($) / months</label>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={costs.implementationCost} onChange={(e) => setCosts({ implementationCost: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
            <input type="number" min={1} value={costs.implementationAmortizationMonths} onChange={(e) => setCosts({ implementationAmortizationMonths: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl shadow-sm border"><div className="text-slate-500 text-sm">Tickets Deflected / mo</div><div className="text-3xl font-semibold">{num1(results.deflectedTickets)}</div><div className="text-slate-500 text-sm">Residual: {num1(results.residualTickets)}</div></div>
        <div className="p-5 bg-white rounded-2xl shadow-sm border"><div className="text-slate-500 text-sm">Annual Hours Saved</div><div className="text-3xl font-semibold">{num1(results.totalHoursSaved)}</div><div className="text-slate-500 text-sm">Deflection + AHT</div></div>
        <div className="p-5 bg-white rounded-2xl shadow-sm border"><div className="text-slate-500 text-sm">Annual Labor Savings</div><div className="text-3xl font-semibold">{currencyFmt(results.totalLaborSavings)}</div><div className="text-slate-500 text-sm">before software costs</div></div>
        <div className="p-5 bg-white rounded-2xl shadow-sm border"><div className="text-slate-500 text-sm">Net Benefit / ROI</div><div className="text-3xl font-semibold">{currencyFmt(results.netBenefit)}</div><div className={(results.roiPct>=0?"text-emerald-600":"text-red-600")+" text-sm"}>{isFinite(results.roiPct)?results.roiPct.toFixed(0):"—"}% ROI</div></div>
      </div>

      {/* Top CTA under summary grid */}
      <div className="flex justify-end mt-3">
        <a href={schedulerHref} target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700">Book a Call with These Results</a>
      </div>
    </div>
  );
}

// ------------------ Page Wrapper ------------------
export default function ROIPage() {
  const [activeTab, setActiveTab] = useState<'automation' | 'support'>("automation");
  const [currencyCode] = useState("USD"); // Extend later if you want user-selectable currency

  // Automation state
  const [tasks, setTasks] = useState<TaskRow[]>([
    { id: crypto.randomUUID(), name: "Inbound email triage & responses", minutesPerTask: 5, tasksPerMonth: 1200, people: 2, automationRate: 60, hourlyCost: 40 },
    { id: crypto.randomUUID(), name: "CRM data entry / notes", minutesPerTask: 3, tasksPerMonth: 1600, people: 2, automationRate: 70, hourlyCost: 40 },
  ]);
  const [adoptionRate, setAdoptionRate] = useState(80);
  const [autoCosts, setAutoCosts] = useState<AutomationCosts>({ monthlyPlatformCost: 300, monthlyAIUsageCost: 150, implementationCost: 2500, implementationAmortizationMonths: 12 });
  const automationResults = useAutomationResults(tasks, adoptionRate, autoCosts);

  // Support state
  const [supportInputs, setSupportInputsRaw] = useState<SupportInputs>({ monthlyTickets: 1800, currentAHT: 7, deflectionRate: 25, ahtReductionRate: 20, hourlyCost: 38 });
  const [supportCosts, setSupportCosts] = useState<AutomationCosts>({ monthlyPlatformCost: 300, monthlyAIUsageCost: 200, implementationCost: 3500, implementationAmortizationMonths: 12 });
  const supportResults = useSupportResults(supportInputs, supportCosts);
  const setSupportInputs = (patch: Partial<SupportInputs>) => setSupportInputsRaw((p) => ({ ...p, ...patch }));

  // Dynamic scheduler link carries metrics from the active tab
  const schedulerHref = useMemo(() => {
    if (activeTab === "automation") {
      return buildURL(SCHEDULER_URL, {
        tab: "automation",
        hours: Math.round(automationResults.totalHoursSaved),
        savings: Math.round(automationResults.totalLaborSavings),
        roi: Math.round(automationResults.roiPct),
        payback: isFinite(automationResults.paybackMonths) ? automationResults.paybackMonths.toFixed(1) : "NA",
        currency: currencyCode,
        source: "roi-calculator",
      });
    }
    return buildURL(SCHEDULER_URL, {
      tab: "support",
      deflected_hours: Math.round(supportResults.totalHoursSaved),
      savings: Math.round(supportResults.totalLaborSavings),
      fte: (supportResults.totalHoursSaved / HOURS_PER_FTE).toFixed(1),
      currency: currencyCode,
      source: "roi-calculator",
    });
  }, [activeTab, automationResults, supportResults, currencyCode]);

  // Email me summary (mailto)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");

  const handleEmail = () => {
    const summary = activeTab === 'automation'
      ? `Automation ROI\nHours saved (annual): ${num1(automationResults.totalHoursSaved)}\nLabor savings: ${currencyFmt(automationResults.totalLaborSavings)}\nCosts: ${currencyFmt(automationResults.totalAnnualCosts)}\nROI: ${isFinite(automationResults.roiPct)?automationResults.roiPct.toFixed(0):'—'}%\nPayback: ${isFinite(automationResults.paybackMonths)?automationResults.paybackMonths.toFixed(1):'—'} months`
      : `Support ROI\nHours saved (annual): ${num1(supportResults.totalHoursSaved)}\nLabor savings: ${currencyFmt(supportResults.totalLaborSavings)}\nCosts: ${currencyFmt(supportResults.totalAnnualCosts)}\nROI: ${isFinite(supportResults.roiPct)?supportResults.roiPct.toFixed(0):'—'}%\nPayback: ${isFinite(supportResults.paybackMonths)?supportResults.paybackMonths.toFixed(1):'—'} months`;

    const subject = `ROI Results – ${company || name || "Prospect"}`;
    const body = `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nNotes: ${notes}\n\n${summary}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header + tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">AI ROI Calculators</h1>
          <p className="text-slate-600">Run scenarios for Automation or Support. Book a call with your results pre-filled.</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-2xl p-1 border">
          <button onClick={() => setActiveTab('automation')} className={`px-4 py-2 rounded-2xl ${activeTab==='automation'?'bg-slate-900 text-white':'bg-transparent'}`}>Automation</button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2 rounded-2xl ${activeTab==='support'?'bg-slate-900 text-white':'bg-transparent'}`}>Support</button>
        </div>
      </div>

      {/* Calculator body */}
      {activeTab === 'automation' ? (
        <AutomationCalculator
          currencyCode={currencyCode}
          tasks={tasks}
          setTasks={setTasks}
          adoptionRate={adoptionRate}
          setAdoptionRate={setAdoptionRate}
          costs={autoCosts}
          setCosts={(patch) => setAutoCosts((c) => ({ ...c, ...patch }))}
          results={automationResults}
          schedulerHref={schedulerHref}
        />
      ) : (
        <SupportCalculator
          inputs={supportInputs}
          setInputs={setSupportInputs}
          costs={supportCosts}
          setCosts={(patch) => setSupportCosts((c) => ({ ...c, ...patch }))}
          results={supportResults}
          schedulerHref={schedulerHref}
        />
      )}

      {/* Lead capture + bottom CTA */}
      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <h2 className="font-semibold mb-3">Email the results (optional)</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <input className="border rounded-xl px-3 py-2" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Company" value={company} onChange={(e)=>setCompany(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Notes (optional)" value={notes} onChange={(e)=>setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end mt-3 gap-2">
          <button onClick={handleEmail} className="px-5 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700">Email Me the ROI Summary</button>
          <a href={schedulerHref} target="_blank" rel="noopener noreferrer" className="px-5 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700">Book a Call with These Results</a>
        </div>
        <div className="text-xs text-slate-500 mt-2">Uses your email client (mailto:). Swap to a serverless endpoint to persist leads.</div>
      </div>

      <div className="text-xs text-slate-500">Built by RH Consulting. Estimates only; not guarantees.</div>
    </div>
  );
}

