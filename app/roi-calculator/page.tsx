# 0) Be sure you're inside the repo root
pwd

# 1) Switch to your working branch (you've been using fix/home-restore)
git checkout fix/home-restore || git switch fix/home-restore

# 2) Install PDF deps
npm i jspdf html2canvas

# 3) Back up your current ROI page (optional)
mkdir -p .backup && cp -f app/roi-calculator/page.tsx .backup/page.roi.tsx 2>/dev/null || true

# 4) Replace the ROI page with the fixed layout + PDF + CSV + summary + disclaimer
cat > app/roi-calculator/page.tsx << 'TSX'
// app/roi-calculator/page.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";

// ----- constants -----
const CALENDLY_URL = "https://calendly.com/your-handle/30min"; // <-- swap later

const WORKFLOW_SUGGESTIONS = [
  "Lead qualification",
  "FAQ / info requests",
  "Inbound email triage",
  "CRM data entry",
  "Order processing",
  "Appointment scheduling",
  "Ticket routing & tagging",
  "Knowledge-base answer drafting",
  "Invoice reconciliation",
];

// ----- types -----
type Workflow = {
  id: string;
  name: string;
  minPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0-100
  hourly: number;
};

// ----- helpers -----
const fmtMoney = (n: number, currency: string = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

const fmtHours = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n) + " hrs";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const fteFromHours = (hours: number) => hours / 2080; // ≈ 2080 hrs/yr

// ----- main page -----
export default function RoiCalculatorPage() {
  // Program-level inputs
  const [adoption, setAdoption] = useState<number>(80); // % of eligible work that uses agents
  const [platformPerMo, setPlatformPerMo] = useState<number>(300);
  const [aiUsagePerMo, setAiUsagePerMo] = useState<number>(180);
  const [implementation, setImplementation] = useState<number>(2500);
  const [amortizeMonths, setAmortizeMonths] = useState<number>(12);

  // Workflows
  const [rows, setRows] = useState<Workflow[]>([
    {
      id: crypto.randomUUID(),
      name: "Lead qualification",
      minPerTask: 6,
      tasksPerMonth: 100,
      people: 10,
      automationPct: 60,
      hourly: 45,
    },
    {
      id: crypto.randomUUID(),
      name: "FAQ / info requests",
      minPerTask: 4,
      tasksPerMonth: 600,
      people: 1,
      automationPct: 55,
      hourly: 40,
    },
  ]);

  const addWorkflow = () =>
    setRows((r) => [
      ...r,
      {
        id: crypto.randomUUID(),
        name: "",
        minPerTask: 5,
        tasksPerMonth: 200,
        people: 1,
        automationPct: 50,
        hourly: 40,
      },
    ]);

  const removeWorkflow = (id: string) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r)); // keep at least one

  // ----- calculations -----
  const {
    totalHoursSaved,
    totalLaborSavings,
    totalAnnualCosts,
    netBenefit,
    roiPct,
  } = useMemo(() => {
    const adopt = adoption / 100;

    let hours = 0;
    let labor$ = 0;

    rows.forEach((w) => {
      const minutesYear = w.minPerTask * w.tasksPerMonth * 12;
      const hoursYear = (minutesYear / 60) * w.people * (w.automationPct / 100) * adopt;
      hours += hoursYear;
      labor$ += hoursYear * w.hourly;
    });

    const annualCosts = (platformPerMo + aiUsagePerMo) * 12 + implementation / Math.max(1, amortizeMonths);
    const net = labor$ - annualCosts;
    const roi = annualCosts > 0 ? (net / annualCosts) * 100 : 0;

    return {
      totalHoursSaved: hours,
      totalLaborSavings: labor$,
      totalAnnualCosts: annualCosts,
      netBenefit: net,
      roiPct: roi,
    };
  }, [adoption, platformPerMo, aiUsagePerMo, implementation, amortizeMonths, rows]);

  // ----- CSV -----
  const exportCSV = () => {
    const header = [
      "Workflow",
      "Min/Task (min)",
      "Tasks/mo",
      "People",
      "Automation %",
      "Hourly $",
    ].join(",");

    const lines = rows.map((w) =>
      [
        `"${w.name.replace(/"/g, '""')}"`,
        w.minPerTask,
        w.tasksPerMonth,
        w.people,
        w.automationPct,
        w.hourly,
      ].join(",")
    );

    const totals = [
      "",
      "",
      "",
      "",
      "Totals",
      "",
    ].join(",");

    const summary = [
      "",
      "",
      "",
      "",
      `Hours Saved/yr: ${totalHoursSaved.toFixed(1)}`,
      `Labor $/yr: ${Math.round(totalLaborSavings)}`,
    ].join(",");

    const blob = new Blob([header + "\n" + lines.join("\n") + "\n" + totals + "\n" + summary], {
      type: "text/csv;charset=utf-8;",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roi-results.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ----- PDF -----
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    const [html2canvas, { jsPDF }] = await Promise.all([
      import("html2canvas").then((m) => m.default),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(pdfRef.current, {
      backgroundColor: getComputedStyle(document.body).backgroundColor || "#0b0f1a",
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    // Single-page landscape PDF better matches our layout
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;
    pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
    pdf.save("RH-Consulting-ROI.pdf");
  };

  // ----- UI helpers -----
  const setField =
    <K extends keyof Workflow>(id: string, key: K) =>
    (v: number | string) =>
      setRows((r) =>
        r.map((w) =>
          w.id !== id
            ? w
            : {
                ...w,
                [key]:
                  typeof w[key] === "number"
                    ? Number(v || 0)
                    : String(v),
              } as Workflow
        )
      );

  const Card = ({
    title,
    subtitle,
    value,
    highlight = false,
  }: {
    title: string;
    subtitle?: string;
    value: React.ReactNode;
    highlight?: boolean;
  }) => (
    <div
      className={[
        "rounded-2xl border p-5",
        highlight
          ? "border-orange-500/40 bg-orange-500/5"
          : "border-white/10 bg-white/5",
      ].join(" ")}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {subtitle ? (
        <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
      ) : null}
    </div>
  );

  // ----- render -----
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header & Call to action */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold">AI ROI Calculators</h1>
          <p className="mt-2 text-muted-foreground">
            Estimate time & cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 font-medium shadow"
          >
            Book a Call (passes your ROI)
          </a>
          <button
            onClick={downloadPDF}
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium"
          >
            Download PDF
          </button>
          <button
            onClick={exportCSV}
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div ref={pdfRef} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            title="Annual hours saved"
            value={fmtHours(totalHoursSaved)}
            subtitle={`≈ ${fteFromHours(totalHoursSaved).toFixed(1)} FTE`}
          />
          <Card
            title="Annual labor savings"
            value={fmtMoney(totalLaborSavings)}
            subtitle="before software costs"
          />
          <Card
            title="Total annual costs"
            value={fmtMoney(totalAnnualCosts)}
            subtitle="platform + usage + build"
          />
          <Card
            title="Net benefit / ROI"
            value={
              <div>
                {fmtMoney(netBenefit)}
                <span className="ml-2 text-emerald-400 font-medium">
                  ({Math.round(roiPct)}% ROI)
                </span>
              </div>
            }
            highlight
          />
        </div>

        {/* Program inputs */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Adoption slider spans full width on small, 2 cols on large */}
            <div className="lg:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Adoption rate (%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={adoption}
                onChange={(e) => setAdoption(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {adoption}% of eligible work
              </div>
            </div>

            <NumberField
              label="Platform cost / mo"
              value={platformPerMo}
              onChange={setPlatformPerMo}
            />
            <NumberField label="AI usage / mo" value={aiUsagePerMo} onChange={setAiUsagePerMo} />
            <NumberField
              label="Implementation (one-time)"
              value={implementation}
              onChange={setImplementation}
            />
            <NumberField
              label="Amortize (months)"
              value={amortizeMonths}
              onChange={(v) => setAmortizeMonths(clamp(v, 1, 36))}
            />
          </div>
        </section>

        {/* Workflows */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="grid grid-cols-12 gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <div className="col-span-12 sm:col-span-3">Workflow</div>
            <div className="col-span-4 sm:col-span-1">Min/Task</div>
            <div className="col-span-4 sm:col-span-2">Tasks/mo</div>
            <div className="col-span-4 sm:col-span-2">People</div>
            <div className="col-span-6 sm:col-span-2">Automation %</div>
            <div className="col-span-6 sm:col-span-2">Hourly $</div>
          </div>

          <div className="space-y-5">
            {rows.map((w, idx) => (
              <div key={w.id} className="relative grid grid-cols-12 gap-3">
                {/* Remove action floated above right on each row */}
                <button
                  onClick={() => removeWorkflow(w.id)}
                  className="absolute right-0 -top-6 text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>

                {/* Workflow (searchable via datalist) */}
                <div className="col-span-12 sm:col-span-3">
                  <label className="sr-only">Workflow</label>
                  <input
                    list={`wf-${idx}`}
                    value={w.name}
                    onChange={(e) => setField("id", "name")(e.target.value)}
                    placeholder="Type or choose a workflow"
                    className="w-full rounded-xl border border-white/10 bg-neutral-900/40 px-3 py-2"
                  />
                  <datalist id={`wf-${idx}`}>
                    {WORKFLOW_SUGGESTIONS.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>

                <div className="col-span-4 sm:col-span-1">
                  <NumberField
                    value={w.minPerTask}
                    onChange={setField(w.id, "minPerTask")}
                    ariaLabel="Minutes per Task"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <NumberField
                    value={w.tasksPerMonth}
                    onChange={setField(w.id, "tasksPerMonth")}
                    ariaLabel="Tasks per Month"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <NumberField
                    value={w.people}
                    onChange={setField(w.id, "people")}
                    ariaLabel="People"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <NumberField
                    value={w.automationPct}
                    onChange={(v) => setField(w.id, "automationPct")(clamp(v, 0, 100))}
                    ariaLabel="Automation Percent"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <NumberField
                    value={w.hourly}
                    onChange={setField(w.id, "hourly")}
                    ariaLabel="Hourly Rate"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add workflow is now tight under the last row */}
          <div>
            <button
              onClick={addWorkflow}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm"
            >
              + Add workflow
            </button>
          </div>
        </section>

        {/* Calculation Summary (carrot) + Disclaimer */}
        <details className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <summary className="cursor-pointer list-none">
            <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-xs mr-2 align-middle">
              ▼
            </span>
            <span className="font-medium">Calculation Summary</span>
          </summary>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Hours saved / workflow</strong> = minutes per task × tasks/mo × people × automation% × adoption% × 12 months.
            </p>
            <p>
              <strong>Annual $ saved</strong> = hours saved × hourly cost (loaded).
            </p>
            <p>
              <strong>Total annual costs</strong> = (platform/mo + AI usage/mo) × 12 + (implementation ÷ amortize months).
            </p>
            <p>
              <strong>Net benefit</strong> = annual labor savings – total annual costs. &nbsp;
              <strong>ROI %</strong> = net benefit ÷ total annual costs.
            </p>
            <p>
              Defaults mirror a typical ~100-employee SMB. Tune adoption and automation% to your reality.
            </p>
          </div>
        </details>

        <p className="text-xs text-muted-foreground/90 leading-relaxed">
          <strong>Disclaimer:</strong> This tool is for illustration only and should not be relied upon as a guarantee of
          financial results. Actual outcomes vary with implementation practices, user adoption, configurations, business
          processes, market conditions, and broader economic factors. Initial benefits may appear within weeks; larger
          transitions typically roll in over time. Software license costs and third-party fees may apply depending on your
          stack. All figures shown in USD unless noted otherwise.
        </p>
      </div>
    </main>
  );
}

// ----- Reusable number input with "free typing" (backspace works) -----
function NumberField({
  label,
  value,
  onChange,
  ariaLabel,
}: {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  ariaLabel?: string;
}) {
  const [text, setText] = useState<string>(String(value));

  // keep internal text in sync if parent updates externally
  React.useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <div>
      {label ? (
        <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-2">
          {label}
        </label>
      ) : null}
      <input
        inputMode="decimal"
        aria-label={ariaLabel}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Number(text.replace(/,/g, ""));
          onChange(isFinite(n) ? n : 0);
          setText(isFinite(n) ? String(n) : "0");
        }}
        className="w-full rounded-xl border border-white/10 bg-neutral-900/40 px-3 py-2"
      />
    </div>
  );
}
TSX

# 5) Commit & push (still on fix/home-restore)
git add app/roi-calculator/page.tsx package.json package-lock.json
git commit -m "ROI: tighter layout (+Add under rows, Remove above), CSV+PDF export, Calculation Summary, disclaimer"
git push origin fix/home-restore

