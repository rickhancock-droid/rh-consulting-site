"use client";

import { useMemo, useState } from "react";

// ---------- types ----------
type Workflow = {
  name: string;
  minutes: number;
  tasks: number;
  people: number;
  automation: number; // percent
  hourly: number; // $/hr loaded
};

// ---------- reusable styles ----------
const inputClasses =
  "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 " +
  "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-0 " +
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

const panelClasses =
  "rounded-2xl border bg-white text-slate-900 border-slate-200 shadow-sm " +
  "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800";

// ---------- constants ----------
const HOURS_PER_FTE = 2080;
const CALENDLY_BASE = "https://calendly.com/rick-hancock-rhconsulting/30min";

// ---------- component ----------
export default function ROICalculator() {
  // defaults ~100-employee SMB
  const [adoption, setAdoption] = useState<number>(80);
  const [platformCost, setPlatformCost] = useState<number>(300);
  const [aiUsage, setAiUsage] = useState<number>(180);
  const [implCost, setImplCost] = useState<number>(2500);
  const [amortize, setAmortize] = useState<number>(12);

  const [workflows, setWorkflows] = useState<Workflow[]>([
    { name: "Lead qualification", minutes: 6, tasks: 100, people: 10, automation: 60, hourly: 45 },
    { name: "FAQ / info requests", minutes: 4, tasks: 600, people: 1, automation: 55, hourly: 40 },
  ]);

  const hoursSavedPerWorkflow = (wf: Workflow) =>
    (wf.minutes / 60) *
    wf.tasks *
    12 *
    wf.people *
    (wf.automation / 100) *
    (adoption / 100);

  const totalHours = useMemo(
    () => workflows.reduce((s, wf) => s + hoursSavedPerWorkflow(wf), 0),
    [workflows, adoption]
  );

  const annualLaborSaved = useMemo(
    () => workflows.reduce((sum, wf) => sum + hoursSavedPerWorkflow(wf) * wf.hourly, 0),
    [workflows, adoption]
  );

  const totalAnnualCosts = useMemo(
    () => (platformCost + aiUsage) * 12 + implCost / Math.max(1, amortize),
    [platformCost, aiUsage, implCost, amortize]
  );

  const netBenefit = annualLaborSaved - totalAnnualCosts;
  const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : 0;

  // Build Calendly link with results
  const calendlyHref = useMemo(() => {
    const params = new URLSearchParams({
      hours: String(Math.round(totalHours)),
      fte: (totalHours / HOURS_PER_FTE).toFixed(1),
      labor_savings: Math.round(annualLaborSaved).toString(),
      annual_costs: Math.round(totalAnnualCosts).toString(),
      net_benefit: Math.round(netBenefit).toString(),
      roi_pct: Math.round(roiPct).toString(),
      adoption: String(adoption),
      platform_mo: String(platformCost),
      ai_usage_mo: String(aiUsage),
      implementation: String(implCost),
      amortize_months: String(amortize),
      // helpful context for the booking form
      text:
        "Pre-filled ROI from rhconsulting.ai calculator. Hours, savings, and costs attached as query params.",
    });
    return `${CALENDLY_BASE}?${params.toString()}`;
  }, [
    totalHours,
    annualLaborSaved,
    totalAnnualCosts,
    netBenefit,
    roiPct,
    adoption,
    platformCost,
    aiUsage,
    implCost,
    amortize,
  ]);

  // ----- UI -----
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Agentic Automation ROI
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        Estimate time and cost savings from AI agents across your workflows. Defaults shown for a{" "}
        <strong>100-employee SMB</strong>. Adjust for your company size.
      </p>

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <div className={`${panelClasses} p-4`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Hours saved / yr</p>
          <p className="text-2xl font-semibold">{Math.round(totalHours)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ≈ {(totalHours / HOURS_PER_FTE).toFixed(1)} FTE
          </p>
        </div>
        <div className={`${panelClasses} p-4`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">FTE equivalent</p>
          <p className="text-2xl font-semibold">{(totalHours / HOURS_PER_FTE).toFixed(1)}</p>
        </div>
        <div className={`${panelClasses} p-4`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Labor savings / yr</p>
          <p className="text-2xl font-semibold">
            ${Math.round(annualLaborSaved).toLocaleString()}
          </p>
        </div>
        <div className={`${panelClasses} p-4`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">ROI</p>
          <p className="text-2xl font-semibold text-emerald-500">{Math.round(roiPct)}%</p>
        </div>
      </div>

      {/* Controls */}
      <div className={`${panelClasses} space-y-4 p-6`}>
        <div>
          <label className="block text-sm font-medium">Adoption Rate (%)</label>
          <input
            type="range"
            min={0}
            max={100}
            value={adoption}
            onChange={(e) => setAdoption(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-slate-500">{adoption}% of eligible work uses agents</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium">Platform cost / mo</label>
            <input
              type="number"
              className={inputClasses}
              value={platformCost}
              onChange={(e) => setPlatformCost(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">AI usage / mo</label>
            <input
              type="number"
              className={inputClasses}
              value={aiUsage}
              onChange={(e) => setAiUsage(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Implementation (one-time)</label>
            <input
              type="number"
              className={inputClasses}
              value={implCost}
              onChange={(e) => setImplCost(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Amortize over (months)</label>
            <input
              type="number"
              className={inputClasses}
              value={amortize}
              onChange={(e) => setAmortize(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Workflows table */}
      <div className={`${panelClasses} p-6`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th>Workflow</th>
              <th>Min/Task</th>
              <th>Tasks/mo</th>
              <th>People</th>
              <th>Automation %</th>
              <th>Hourly $</th>
              <th className="text-right">Annual $ saved</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf, i) => (
              <tr key={i} className="border-t border-slate-200 dark:border-slate-800">
                <td className="pr-2">{wf.name}</td>
                <td className="pr-2">
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.minutes}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i] = { ...wf, minutes: Number(e.target.value) };
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td className="pr-2">
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.tasks}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i] = { ...wf, tasks: Number(e.target.value) };
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td className="pr-2">
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.people}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i] = { ...wf, people: Number(e.target.value) };
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td className="pr-2">
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.automation}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i] = { ...wf, automation: Number(e.target.value) };
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td className="pr-2">
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.hourly}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i] = { ...wf, hourly: Number(e.target.value) };
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td className="text-right font-medium">
                  ${Math.round(hoursSavedPerWorkflow(wf) * wf.hourly).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explainer */}
      <details className={`${panelClasses} p-6`}>
        <summary className="cursor-pointer select-none text-lg font-semibold">
          How we calculate ROI
        </summary>
        <div className="prose prose-slate max-w-none pt-4 dark:prose-invert">
          <ul>
            <li>
              <strong>Hours saved / workflow</strong> = minutes per task × tasks/mo × people ×
              automation% × adoption% × 12 months.
            </li>
            <li>
              <strong>Annual $ saved</strong> = hours saved × hourly cost (loaded).
            </li>
            <li>
              <strong>Total annual costs</strong> = (platform/mo + AI usage/mo) × 12 + (implementation ÷
              amortize months) × 12.
            </li>
            <li>
              <strong>Net benefit</strong> = annual labor savings − total annual costs.
            </li>
            <li>
              <strong>ROI %</strong> = net benefit ÷ total annual costs.
            </li>
          </ul>
          <p>
            Defaults mirror a typical <em>100-employee SMB</em>. Tune adoption and automation% to your
            reality. We can also model software license consolidation or additional headcount lift on a
            live call.
          </p>
        </div>
      </details>

      {/* CTA */}
      <div className="pt-2 text-center">
        <a
          href={calendlyHref}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Book a Call with These Results
        </a>
      </div>
    </div>
  );
}

