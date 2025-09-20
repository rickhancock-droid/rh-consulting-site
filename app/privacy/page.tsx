export const metadata = {
  title: "Privacy Policy | RH Consulting",
  description: "How we handle data and privacy at RH Consulting.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-4 text-brand-muted">
        We respect your privacy. We collect only the data necessary to deliver services you request.
        For booking calls, your scheduling provider’s policy also applies.
      </p>
      <h2 className="text-xl font-semibold mt-8">What we collect</h2>
      <ul className="list-disc pl-6 mt-2 text-brand-muted">
        <li>Contact details you provide (name, email, company)</li>
        <li>ROI inputs when you choose to share them via email or calendar link</li>
        <li>Anonymous analytics for site performance and improvements</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8">Contact</h2>
      <p className="mt-2 text-brand-muted">
        Email <a className="text-brand-primary underline" href="mailto:hello@rhconsulting.ai">hello@rhconsulting.ai</a>
      </p>
    </section>
  );
}

