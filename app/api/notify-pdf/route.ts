// app/api/notify-pdf/route.ts
import { NextResponse } from "next/server";

// Optional: use RESEND_API_KEY to actually send. If not set, we just log.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_TO = process.env.PDF_NOTIFY_TO || "rick.hancock@rhconsulting.ai";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Minimal validation / shaping
    const payload = {
      pageUrl: body?.pageUrl || SITE + "/roi-calculator",
      mode: body?.mode,
      adoption: body?.adoption,
      employees: body?.employees,
      annualHours: body?.annualHours,
      annualLaborSavings: body?.annualLaborSavings,
      annualCosts: body?.annualCosts,
      netBenefit: body?.netBenefit,
      roiPct: Math.round(body?.roiPct ?? 0),
      ts: new Date().toISOString(),
    };

    // If no key, do a no-op success so the UI never breaks
    if (!RESEND_API_KEY) {
      console.log("[notify-pdf] (dry-run) ", payload);
      return NextResponse.json({ ok: true, dryRun: true });
    }

    // Lazy import only when key is present (keeps build small)
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    const subject = `ROI PDF generated — ${payload.roiPct}% ROI (${payload.mode} @ ${payload.adoption}%)`;
    const text = [
      `A new ROI PDF was generated.`,
      ``,
      `Mode: ${payload.mode}`,
      `Automation Adoption: ${payload.adoption}%`,
      `Employees: ${payload.employees}`,
      `Annual Hours Saved: ${payload.annualHours}`,
      `Annual Labor Savings: $${payload.annualLaborSavings}`,
      `Total Annual Costs: $${payload.annualCosts}`,
      `Net Benefit: $${payload.netBenefit}`,
      `ROI: ${payload.roiPct}%`,
      ``,
      `Page: ${payload.pageUrl}`,
      `When: ${payload.ts}`,
    ].join("\n");

    await resend.emails.send({
      from: "roi@rhconsulting.ai",
      to: [NOTIFY_TO],
      subject,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-pdf] error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

