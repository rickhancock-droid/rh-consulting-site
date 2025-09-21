"use client";

import { useState } from "react";

// ---------- reusable styles ----------
const inputClasses =
  "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 " +
  "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-0 " +
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

const panelClasses =
  "rounded-2xl border bg-white text-slate-900 border-slate-200 shadow-sm " +
  "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800";

// ---------- ROI calculator ----------
export default function ROICalculator() {
  const [adoption, setAdoption] = useState(80);
  const [platformCost, setPlatformCost] = useState(300);
  const [aiUsage, setAiUsage] = useState(180);
  const [implCost, setImplCost] = useState(2500);
  const [amortize, setAmortize] = useState(12);

  const [workflows, setWorkflows] = useState([
    { name: "Lead qualification", minutes: 6, tasks: 100, people: 10, automation: 60, hourly: 45 },
    { name: "FAQ / info requests", minutes: 4, tasks: 600, people: 1, automation: 55, hourly: 40 },
  ]);

  const hoursSavedPerWorkflow = (wf: any) =>
    (wf.minutes / 60) * wf.tasks * 12 * wf.people * (wf.automation / 100) * (adoption / 100);

  const totalHours = workflows.reduce((s, wf) => s + hoursSavedPerWorkflow(wf), 0);
  const annualLaborSaved = workflows.reduce(
    (sum, wf) => sum + hoursSavedPerWorkflow(wf) * wf.hourly,
    0
  );
  const totalAnnualCosts = (platformCost + aiUsage) * 12 + implCost / amortize;
  const netBenefit = annualLaborSaved - totalAnnualCosts;
  const roiPct = totalAnnualCosts > 0 ? (netBenefit / totalAnnualCosts) * 100 : 0;

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
        <div className={panelClasses + " p-4"}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Hours saved / yr</p>
          <p className="text-2xl font-semibold">{totalHours.toFixed(0)}</p>
        </div>
        <div className={panelClasses + " p-4"}>
          <p className="text-sm text-slate-500 dark:text-slate-400">FTE equivalent</p>
          <p className="text-2xl font-semibold">{(totalHours / 2080).toFixed(1)}</p>
        </div>
        <div className={panelClasses + " p-4"}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Labor savings / yr</p>
          <p className="text-2xl font-semibold">${annualLaborSaved.toLocaleString()}</p>
        </div>
        <div className={panelClasses + " p-4"}>
          <p className="text-sm text-slate-500 dark:text-slate-400">ROI</p>
          <p className="text-2xl font-semibold text-green-500">{roiPct.toFixed(0)}%</p>
        </div>
      </div>

      {/* Program costs + adoption slider */}
      <div className={panelClasses + " p-6 space-y-4"}>
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

      {/* Workflows */}
      <div className={panelClasses + " p-6"}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th>Workflow</th>
              <th>Min/Task</th>
              <th>Tasks/mo</th>
              <th>People</th>
              <th>Automation %</th>
              <th>Hourly $</th>
              <th>Annual $ saved</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf, i) => (
              <tr key={i} className="border-t border-slate-200 dark:border-slate-800">
                <td>{wf.name}</td>
                <td>
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.minutes}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i].minutes = Number(e.target.value);
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.tasks}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i].tasks = Number(e.target.value);
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.people}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i].people = Number(e.target.value);
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.automation}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i].automation = Number(e.target.value);
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={inputClasses}
                    value={wf.hourly}
                    onChange={(e) => {
                      const updated = [...workflows];
                      updated[i].hourly = Number(e.target.value);
                      setWorkflows(updated);
                    }}
                  />
                </td>
                <td className="text-right font-medium">
                  ${(hoursSavedPerWorkflow(wf) * wf.hourly).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explainer */}
      <details className={panelClasses + " p-6"}>
        <summary className="cursor-pointer select-none text-lg font-semibold">
          How we calculate ROI
        </summary>
        <div className="prose prose-slate max-w-none pt-4 dark:prose-invert">
          <ul>
            <li><strong>Hours saved / workflow</strong> = minutes per task × tasks/mo × people × automation% × adoption% × 12 months.</li>
            <li><strong>Annual $ saved</strong> = hours saved × hourly cost (loaded).</li>
            <li><strong>Total annual costs</strong> = (platform/mo + AI usage/mo) × 12 + (implementation ÷ amortize months) × 12.</li>
            <li><strong>Net benefit</strong> = annual labor savings − total annual costs.</li>
            <li><strong>ROI %</strong> = net benefit ÷ total annual costs.</li>
          </ul>
          <p>
            Defaults mirror a typical <em>100-employee SMB</em>. Tune adoption and automation% to
            your reality. We can also model software license consolidation or additional headcount lift
            on a live call.
          </p>
        </div>
      </details>

      {/* Call-to-action button */}
      <div className="pt-6 text-center">
        <button className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
          Book a Call with These Results
        </button>
      </div>
    </div>
  );
}

