// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useState } from "react";

type Workflow = {
  name: string;
  minutesPerTask: number;
  tasksPerMonth: number;
  people: number;
  automation: number;
  hourly: number;
};

const defaultWorkflows: Workflow[] = [
  { name: "Lead qualification", minutesPerTask: 6, tasksPerMonth: 100, people: 10, automation: 60, hourly: 45 },
  { name: "FAQ / info requests", minutesPerTask: 4, tasksPerMonth: 600, people: 1, automation: 55, hourly: 40 },
];

export default function RoiCalculator() {
  const [workflows, setWorkflows] = useState<Workflow[]>(defaultWorkflows);
  const [adoption, setAdoption] = useState(80);
  const [platformCost, setPlatformCost] = useState(300);
  const [aiUsage, setAiUsage] = useState(180);
  const [implementation, setImplementation] = useState(2500);
  const [amortize, setAmortize] = useState(12);

  // --- calculations ---
  const results = useMemo(() => {
    let totalHours = 0;
    let totalSaved = 0;

    workflows.forEach((w) => {
      const hours =
        (w.minutesPerTask / 60) *
        w.tasksPerMonth *
        12 *
        w.people *
        (w.automation / 100) *
        (adoption / 100);
      totalHours += hours;
      totalSaved += hours * w.hourly;
    });

    const annualCosts = (platformCost + aiUsage) * 12 + implementation / amortize;
    const netBenefit = totalSaved - annualCosts;
    const roiPct = annualCosts > 0 ? (netBenefit / annualCosts) * 100 : 0;

    return {
      totalHours,
      totalSaved,
      annualCosts,
      netBenefit,
      roiPct,
      fte: totalHours / 2080,
    };
  }, [workflows, adoption, platformCost, aiUsage, implementation, amortize]);

  // --- helpers ---
  const fmtMoney = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  // --- update workflow ---
  const updateWorkflow = (i: number, field: keyof Workflow, value: number | string) => {
    const newWF = [...workflows];
    if (field === "name") {
      newWF[i][field] = String(value);
    } else {
      newWF[i][field] = Number(value);
    }
    setWorkflows(newWF);
  };

  const removeWorkflow = (i: number) => {
    setWorkflows(workflows.filter((_, idx) => idx !== i));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI ROI Calculators</h1>
          <p className="text-gray-400">
            Estimate time & cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>
        <a
          href="https://calendly.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full shadow-lg"
        >
          Book a Call (passes your ROI)
        </a>
      </div>

      {/* Results Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-2xl shadow text-center">
          <p className="text-sm text-gray-400">ANNUAL HOURS SAVED</p>
          <p className="text-2xl font-bold">{results.totalHours.toFixed(1)} hrs</p>
          <p className="text-xs text-gray-500">≈ {results.fte.toFixed(1)} FTE</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-2xl shadow text-center">
          <p className="text-sm text-gray-400">ANNUAL LABOR SAVINGS</p>
          <p className="text-2xl font-bold">{fmtMoney(results.totalSaved)}</p>
          <p className="text-xs text-gray-500">before software costs</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-2xl shadow text-center">
          <p className="text-sm text-gray-400">TOTAL ANNUAL COSTS</p>
          <p className="text-2xl font-bold">{fmtMoney(results.annualCosts)}</p>
          <p className="text-xs text-gray-500">platform + usage + build</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-2xl shadow text-center border border-orange-400">
          <p className="text-sm text-gray-400">NET BENEFIT / ROI</p>
          <p className="text-2xl font-bold text-green-400">{fmtMoney(results.netBenefit)}</p>
          <p className="text-xs text-green-400">{results.roiPct.toFixed(0)}% ROI</p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-900 p-4 rounded-2xl shadow">
        <div>
          <label className="text-sm">Adoption Rate (%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={adoption}
            onChange={(e) => setAdoption(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-400">{adoption}% of eligible work</p>
        </div>
        <div>
          <label className="text-sm">Platform cost / mo</label>
          <input
            type="number"
            className="w-full rounded bg-gray-800 p-2"
            value={platformCost}
            onChange={(e) => setPlatformCost(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm">AI usage / mo</label>
          <input
            type="number"
            className="w-full rounded bg-gray-800 p-2"
            value={aiUsage}
            onChange={(e) => setAiUsage(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm">Implementation (one-time)</label>
          <input
            type="number"
            className="w-full rounded bg-gray-800 p-2"
            value={implementation}
            onChange={(e) => setImplementation(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm">Amortize (months)</label>
          <input
            type="number"
            className="w-full rounded bg-gray-800 p-2"
            value={amortize}
            onChange={(e) => setAmortize(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Workflows */}
      <div className="bg-gray-900 p-4 rounded-2xl shadow space-y-4">
        <div className="grid grid-cols-7 gap-2 font-bold text-sm text-gray-400">
          <div>Workflow</div>
          <div>Min/Task</div>
          <div>Tasks/mo</div>
          <div>People</div>
          <div>Automation %</div>
          <div>Hourly $</div>
          <div>Annual $ saved</div>
        </div>
        {workflows.map((w, i) => (
          <div key={i} className="grid grid-cols-7 gap-2 items-center">
            <input
              value={w.name}
              onChange={(e) => updateWorkflow(i, "name", e.target.value)}
              className="rounded bg-gray-800 p-2"
            />
            <input
              type="number"
              value={w.minutesPerTask}
              onChange={(e) => updateWorkflow(i, "minutesPerTask", e.target.value)}
              className="rounded bg-gray-800 p-2"
            />
            <input
              type="number"
              value={w.tasksPerMonth}
              onChange={(e) => updateWorkflow(i, "tasksPerMonth", e.target.value)}
              className="rounded bg-gray-800 p-2"
            />
            <input
              type="number"
              value={w.people}
              onChange={(e) => updateWorkflow(i, "people", e.target.value)}
              className="rounded bg-gray-800 p-2"
            />
            <input
              type="number"
              value={w.automation}
              onChange={(e) => updateWorkflow(i, "automation", e.target.value)}
              className="rounded bg-gray-800 p-2"
            />
            <input
              type="number"
              value={w.hourly}
              onChange={(e) => updateWorkflow(i, "hourly", e.target.value)}
              className="rounded bg-gray-800 p-2"
            />
            <div className="flex justify-between items-center">
              <span>{fmtMoney((w.minutesPerTask / 60) * w.tasksPerMonth * 12 * w.people * (w.automation / 100) * (adoption / 100) * w.hourly)}</span>
              <button
                onClick={() => removeWorkflow(i)}
                className="text-red-400 text-sm ml-2"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            setWorkflows([...workflows, { name: "", minutesPerTask: 1, tasksPerMonth: 10, people: 1, automation: 50, hourly: 40 }])
          }
          className="mt-2 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          + Add workflow
        </button>
      </div>

      {/* Explainer */}
      <details className="bg-gray-900 p-4 rounded-2xl shadow">
        <summary className="font-bold cursor-pointer">How we calculate ROI</summary>
        <ul className="mt-2 text-sm space-y-2 text-gray-300">
          <li>
            <b>Hours saved / workflow</b> = minutes per task × tasks/mo × people × automation% × adoption% × 12 months
          </li>
          <li>
            <b>Annual $ saved</b> = hours saved × hourly cost (loaded).
          </li>
          <li>
            <b>Total annual costs</b> = (platform/mo + AI usage/mo) × 12 + (implementation ÷ amortize months).
          </li>
          <li>
            <b>Net benefit</b> = annual labor savings – total annual costs.
          </li>
          <li>
            <b>ROI %</b> = net benefit ÷ total annual costs.
          </li>
        </ul>
      </details>
    </div>
  );
}

