export const metadata = {
  title: "Accessibility Statement | RH Consulting",
  description: "Our commitment to WCAG 2.1 AA accessibility.",
};

export default function AccessibilityPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-brand-ink">Accessibility Statement</h1>
      <p className="mt-4 text-brand-muted">
        RH Consulting is committed to providing a website that is accessible to the widest possible audience,
        regardless of technology or ability. We aim to conform to WCAG 2.1 AA where feasible and continuously improve.
      </p>

      <h2 className="text-xl font-semibold mt-8 text-brand-ink">Measures We Take</h2>
      <ul className="list-disc pl-6 mt-2 text-brand-muted space-y-1">
        <li>Semantic HTML, descriptive alt text, and ARIA where appropriate</li>
        <li>Keyboard navigability and focus states</li>
        <li>Color contrast targeting WCAG AA</li>
        <li>Responsive layouts for mobile and desktop</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 text-brand-ink">Feedback</h2>
      <p className="mt-2 text-brand-muted">
        If you experience any difficulty with content or functionality, please email{" "}
        <a className="text-brand-primary underline" href="mailto:hello@rhconsulting.ai">hello@rhconsulting.ai</a>.
        We review all feedback and aim to address issues promptly.
      </p>

      <p className="text-xs text-brand-muted mt-8">Last updated: {new Date().toLocaleDateString()}</p>
    </section>
  );
}
