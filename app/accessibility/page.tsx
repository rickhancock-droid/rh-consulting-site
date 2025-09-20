export const metadata = {
  title: "Accessibility Statement | RH Consulting",
  description: "Our commitment to accessibility.",
};

export default function AccessibilityPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Accessibility Statement</h1>
      <p className="mt-4 text-brand-muted">
        RH Consulting strives to make our website and calculators accessible to everyone.
        We aim for WCAG 2.1 AA standards and continuously improve keyboard navigation,
        color contrast, and screen reader support.
      </p>
      <h2 className="text-xl font-semibold mt-8">Feedback</h2>
      <p className="mt-2 text-brand-muted">
        If you encounter accessibility barriers, email{" "}
        <a className="text-brand-primary underline" href="mailto:hello@rhconsulting.ai">hello@rhconsulting.ai</a>.
      </p>
    </section>
  );
}

