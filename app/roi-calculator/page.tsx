// app/roi-calculator/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ---------- constants ----------
const LOGO_PATH = "/Original on transparent.png"; // in /public
const CALENDLY_URL = "https://calendly.com/your-handle/30min";

// You can replace this with content loaded from /content/case-studies later
const CASE_STUDY_1 = `
Case Study 1 — Boosting Online Visibility (excerpt)

• Objective: Increase qualified traffic and inbound leads without adding headcount.
• Approach: Automated content research, metadata optimization, and FAQ drafting.
• Results: +62% organic traffic in 90 days; 28% faster response time to inbound requests.
• Takeaway: Lightweight agentic workflows create repeatable lift with minimal change management.
`;

// ---------- small UI helpers ----------
function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] uppercase tracking-wider text-slate-400">{children}</div>;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 ${className}`}>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min ?? 0}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="w-full rounded-xl bg-white/10 px-3 py-2 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );
}

const fmtMoney = (n: number, currency: string = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

const fmtHours = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n) + " hrs";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const fteFromHours = (hours: number) => hours / 2080;

// ---------- types ----------
type Workflow = {
  id: string;
  name: string;
  minPerTask: number;
  tasksPerMonth: number;
  people: number;
  automationPct: number; // 0-100
  hourly: number;
};

// ---------- main ----------
export default function RoiCalculatorPage() {
  // Program settings (SMB defaults)
  const [adoption, setAdoption] = useState<number>(80);
  const [platformAnnual, setPlatformAnnual] = useState<number>(12000);
  const [aiUsageAnnual, setAiUsageAnnual] = useState<number>(6000);
  const [implCost, setImplCost] = useState<number>(5000);
  const [amortizeMonths, setAmortizeMonths] = useState<number>(12);

  // NEW: Users in scope (default 100)
  const [users, setUsers] = useState<number>(100);

  // Workflows
  const [rows, setRows] = useState<Workflow[]>([
    {
      id: crypto.randomUUID(),
      name: "FAQ / info requests",
      minPerTask: 4,
      tasksPerMonth: 1500,
      people: 2,
      automationPct: 60,
      hourly: 45,
    },
    {
      id: crypto.randomUUID(),
      name: "Lead qualification",
      minPerTask: 7,
      tasksPerMonth: 600,
      people: 1,
      automationPct: 50,
      hourly: 45,
    },
  ]);

  const kpis = useMemo(() => {
    // hours saved per workflow
    const wfHours = rows.map((r) => {
      const hrs =
        (r.minPerTask / 60) *
        r.tasksPerMonth *
        12 *
        (r.automationPct / 100) *
        (adoption / 100);
      return { id: r.id, hours: hrs, dollars: hrs * r.hourly, ...r };
    });

    const annualHours = wfHours.reduce((a, b) => a + b.hours, 0);
    const annualLaborSavings = wfHours.reduce((a, b) => a + b.dollars, 0);

    const annualCosts =
      platformAnnual + aiUsageAnnual + (implCost > 0 ? (implCost / Math.max(1, amortizeMonths)) * 12 : 0);

    const netBenefit = annualLaborSavings - annualCosts;
    const roiPct = annualCosts > 0 ? (netBenefit / annualCosts) * 100 : 0;

    return {
      annualHours,
      fte: fteFromHours(annualHours),
      annualLaborSavings,
      annualCosts,
      netBenefit,
      roiPct,
      wfHours,
    };
  }, [rows, adoption, platformAnnual, aiUsageAnnual, implCost, amortizeMonths]);

  // ---------- PDF helpers ----------
  async function loadImageAsDataUrl(path: string): Promise<string | null> {
    try {
      const res = await fetch(path);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  const rootRef = useRef<HTMLDivElement>(null);

  async function handleDownloadPdf() {
    if (!rootRef.current) return;

    // Capture the full calculator area (KPIs -> Summary -> Disclaimer)
    const canvas = await html2canvas(rootRef.current, {
      scale: 2,
      backgroundColor: "#0B1220", // match dark background so it isn't transparent
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });

    // Header
    const logo = await loadImageAsDataUrl(LOGO_PATH);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const marginX = 36;
    const marginTop = 28;
    let cursorY = marginTop;

    if (logo) {
      // place logo left
      pdf.addImage(logo, "PNG", marginX, cursorY, 120, 28);
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("RH Consulting — AI ROI Calculator", pageWidth - marginX, cursorY + 18, {
      align: "right",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(new Date().toLocaleDateString(), pageWidth - marginX, cursorY + 32, {
      align: "right",
    });

    cursorY += 42;

    // Main capture image -> auto paginate
    const maxImgWidth = pageWidth - marginX * 2;
    const ratio = canvas.width / canvas.height;
    let imgWidth = maxImgWidth;
    let imgHeight = imgWidth / ratio;

    // If taller than one page, slice
    let remainingHeight = imgHeight;
    const pxPerPt = canvas.height / imgHeight; // how many canvas px per PDF pt

    let sY = 0; // source Y offset in canvas px
    while (remainingHeight > 0) {
      const availableHeight = pageHeight - cursorY - marginTop;
      const sliceHeightPt = Math.min(availableHeight, remainingHeight);
      const sliceHeightPx = sliceHeightPt * pxPerPt;

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.round(sliceHeightPx);
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.drawImage(
        canvas,
        0,
        Math.round(sY),
        canvas.width,
        Math.round(sliceHeightPx),
        0,
        0,
        canvas.width,
        Math.round(sliceHeightPx)
      );

      const sliceData = sliceCanvas.toDataURL("image/png");
      const sliceHeightScaled = sliceCanvas.height / pxPerPt;

      pdf.addImage(sliceData, "PNG", marginX, cursorY, imgWidth, sliceHeightScaled, undefined, "FAST");

      remainingHeight -= sliceHeightPt;
      sY += sliceHeightPx;

      if (remainingHeight > 0) {
        pdf.addPage();
        cursorY = marginTop;
      }
    }

    // Case Study page
    pdf.addPage();
    const csMargin = marginX;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Case Study", csMargin, 64);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    const csLines = pdf.splitTextToSize(CASE_STUDY_1.trim(), pageWidth - csMargin * 2);
    pdf.text(csLines, csMargin, 90);

    // Save
    const safeCompany = "roi-results";
    pdf.save(`${safeCompany}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ---------- UI ----------
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      {/* Top actions */}
      <div className="flex items-center justify-end gap-3 pt-6">
        <button
          onClick={handleDownloadPdf}
          className="rounded-xl bg-white/10 px-4 py-2 text-slate-100 ring-1 ring-white/10 hover:bg-white/15"
        >
          Download PDF
        </button>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-500/90"
        >
          Book a call (passes your ROI)
        </a>
      </div>

      {/* CAPTURE ROOT FOR PDF */}
      <div id="roi-pdf-root" ref={rootRef} className="mt-6">
        {/* Title + subtitle */}
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">AI ROI Calculators</h1>
        <p className="mt-2 text-slate-300">
          Estimate time &amp; cost savings. Defaults reflect a ~100-employee SMB—tweak for your org.
        </p>

        {/* KPI row */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <Label>Annual hours saved</Label>
            <div className="mt-1 text-3xl font-semibold text-slate-100">
              {fmtHours(kpis.annualHours)}
            </div>
            <div className="text-slate-400 text-sm">≈ {kpis.fte.toFixed(1)} FTE</div>
          </Card>
          <Card>
            <Label>Annual labor savings</Label>
            <div className="mt-1 text-3xl font-semibold text-slate-100">{fmtMoney(kpis.annualLaborSavings)}</div>
            <div className="text-slate-400 text-sm">before software costs</div>
          </Card>
          <Card>
            <Label>Total annual costs</Label>
            <div className="mt-1 text-3xl font-semibold text-slate-100">{fmtMoney(kpis.annualCosts)}</div>
            <div className="text-slate-400 text-sm">platform + usage + build</div>
          </Card>
          <Card className="ring-1 ring-amber-500/30">
            <Label>Net Benefit / ROI</Label>
            <div className="mt-1 flex items-baseline gap-3">
              <div className="text-3xl font-semibold text-slate-100">{fmtMoney(kpis.netBenefit)}</div>
              <div className="text-2xl font-semibold text-emerald-400">
                {Math.round(kpis.roiPct)}%
              </div>
            </div>
          </Card>
        </div>

        {/* Program settings */}
        <Card className="mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <NumField label="Users in scope" value={users} onChange={setUsers} />
            <div className="flex flex-col gap-2">
              <Label>Adoption (% of eligible work)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={adoption}
                  onChange={(e) => setAdoption(Number(e.target.value))}
                  className="w-full"
                />
                <div className="w-14 rounded-lg bg-white/10 py-1 text-center text-slate-100">{adoption}</div>
              </div>
            </div>
            <NumField label="Platform cost (annual)" value={platformAnnual} onChange={setPlatformAnnual} />
            <NumField label="AI usage (annual)" value={aiUsageAnnual} onChange={setAiUsageAnnual} />
            <NumField label="Implementation (one-time)" value={implCost} onChange={setImplCost} />
            <NumField label="Amortize (months)" value={amortizeMonths} onChange={setAmortizeMonths} />
          </div>
        </Card>

        {/* Workflows (existing UI assumed) */}
        {/* Your current workflows editor remains intact */}
        {/* --- PLACEHOLDER: render your workflows table here --- */}
        <div className="mt-6">
          <Card>
            <Label>Workflows</Label>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {rows.map((r, idx) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-slate-200 font-medium">{r.name}</div>
                    <button
                      onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                      className="text-rose-400 hover:text-rose-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
                    <NumField
                      label="Minutes per task"
                      value={r.minPerTask}
                      onChange={(n) =>
                        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, minPerTask: n } : x)))
                      }
                    />
                    <NumField
                      label="Tasks per month"
                      value={r.tasksPerMonth}
                      onChange={(n) =>
                        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, tasksPerMonth: n } : x)))
                      }
                    />
                    <NumField
                      label="People"
                      value={r.people}
                      onChange={(n) =>
                        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, people: n } : x)))
                      }
                    />
                    <NumField
                      label="Automation %"
                      value={r.automationPct}
                      onChange={(n) =>
                        setRows((prev) =>
                          prev.map((x) => (x.id === r.id ? { ...x, automationPct: clamp(n, 0, 100) } : x))
                        )
                      }
                    />
                    <NumField
                      label="Hourly $"
                      value={r.hourly}
                      onChange={(n) =>
                        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, hourly: n } : x)))
                      }
                    />
                    <div className="flex flex-col gap-2">
                      <Label>Annual $ saved</Label>
                      <div className="rounded-xl bg-white/10 px-3 py-2 text-slate-200">
                        {fmtMoney(
                          ((r.minPerTask / 60) *
                            r.tasksPerMonth *
                            12 *
                            (r.automationPct / 100) *
                            (adoption / 100)) *
                            r.hourly
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  setRows((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      name: "New workflow",
                      minPerTask: 5,
                      tasksPerMonth: 500,
                      people: 1,
                      automationPct: 50,
                      hourly: 40,
                    },
                  ])
                }
                className="mt-2 w-fit rounded-xl bg-white/10 px-4 py-2 text-slate-100 ring-1 ring-white/10 hover:bg-white/15"
              >
                + Add workflow
              </button>
              <div className="ml-auto text-sm text-slate-400">
                Total annual costs: {fmtMoney(kpis.annualCosts)}
              </div>
            </div>
          </Card>
        </div>

        {/* Calculation Summary (YOUR APPROVED WORDING) */}
        <Card className="mt-6">
          <div className="text-lg font-semibold text-slate-100 mb-3">▼ Calculation Summary</div>
          <div className="space-y-6 text-slate-200 leading-relaxed">
            <p>
              <span className="font-semibold">Benefit.</span> We estimate a portion of repetitive work shifts from humans
              to AI agents, with adoption ramping over time. Hours saved are based on:{" "}
              <em>employees × minutes per task × tasks per month × automation % × adoption % × 12 months</em>. This
              reflects productivity gains from reduced manual effort and faster completion.
            </p>
            <p>
              <span className="font-semibold">Program Cost.</span> Includes monthly platform costs, AI usage fees, and a
              one-time implementation cost, amortized across the selected number of months.
            </p>
            <p>
              <span className="font-semibold">Net Impact.</span> Net benefit equals annual labor savings minus total
              annual costs. ROI % is <em>net benefit ÷ total annual costs</em>.
            </p>
          </div>
        </Card>

        {/* Disclaimer (always visible) */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
          The results of this calculator are provided for illustrative purposes only to help you explore potential
          benefits of AI automation in your organization. Actual outcomes will vary and are not a guarantee or
          commitment of financial return. Results depend on factors including but not limited to implementation
          practices, user adoption, workflow design and configurations, organizational processes, market conditions, and
          external economic factors. All calculations are presented in US dollars unless otherwise noted.
        </div>
      </div>
    </div>
  );
}

