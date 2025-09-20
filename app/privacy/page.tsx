export const metadata = {
  title: "Privacy Policy | RH Consulting",
  description: "How RH Consulting handles data, cookies, and communications.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-brand-ink">Privacy Policy</h1>
      <p className="mt-4 text-brand-muted">
        We collect only the data needed to deliver services you request and to improve our site.
      </p>

      <h2 className="text-xl font-semibold mt-8 text-brand-ink">Information We Collect</h2>
      <ul className="list-disc pl-6 mt-2 text-brand-muted space-y-1">
        <li>Contact details you voluntarily provide (name, email, company, message)</li>
        <li>ROI inputs only when you choose to share via email or calendar link</li>
        <li>Anonymous usage + performance analytics (e.g., page views, load time)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 text-brand-ink">How We Use Information</h2>
      <ul className="list-disc pl-6 mt-2 text-brand-muted space-y-1">
        <li>To respond to inquiries and deliver consulting services</li>
        <li>To analyze and improve website performance and content</li>
        <li>To personalize recommendations (e.g., ROI analysis follow-ups)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 text-brand-ink">Data Sharing</h2>
      <p className="mt-2 text-brand-muted">
        We do not sell personal data. We may use processors (e.g., analytics, scheduling tools)
        governed by their own policies and DPAs. We share data only as needed to provide services or comply with law.
      </p>

      <h2 className="text-xl font-semibold mt-8 text-brand-ink">Retention & Security</h2>
      <p className="mt-2 text-brand-muted">
        We retain information only as long as necessary for the purposes above and use reasonable measures to protect it.
      </p>

      <h2 className="text-xl font-semibold mt-8 text-brand-ink">Your Choices</h2>
      <ul className="list-disc pl-6 mt-2 text-brand-muted space-y-1">
        <li>Opt out of non-essential analytics via your browser settings</li>
        <li>Request access, correction, or deletion of your data by contacting us</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 text-brand-ink">Contact</h2>
      <p className="mt-2 text-brand-muted">
        Email <a className="text-brand-primary underline" href="mailto:hello@rhconsulting.ai">hello@rhconsulting.ai</a>
      </p>
      <p className="text-xs text-brand-muted mt-8">Last updated: {new Date().toLocaleDateString()}</p>
    </section>
  );
}

