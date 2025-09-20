export const metadata = {
  title: "Accessibility Statement | RH Consulting",
  description: "Our commitment to providing an accessible website experience.",
};

export default function AccessibilityPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-brand-ink dark:text-white">
        Accessibility Statement
      </h1>
      <p className="mt-2 text-sm text-brand-muted dark:text-slate-400">
        Effective date: September 16, 2025
      </p>

      <div className="prose prose-lg prose-slate dark:prose-invert max-w-none mt-6">
        <p>
          RH Strategic Consulting DBA RH Consulting (“RH Consulting,” “we,” “us,”
          or “our”) is committed to providing a website that is accessible to the
          widest possible audience, regardless of technology or ability. We are
          continually improving the user experience for everyone and applying
          relevant accessibility standards.
        </p>

        <p>
          <strong>Website:</strong>{" "}
          <a href="https://www.rhconsulting.ai">https://www.rhconsulting.ai</a>{" "}
          (the “Website”)
        </p>

        <h2>Our standard and approach</h2>
        <p>We aim to meet Web Content Accessibility Guidelines (WCAG) 2.2 Level AA. We use a combination of:</p>
        <ul>
          <li>Design/development best practices (semantic HTML, meaningful headings, labels, ARIA where appropriate)</li>
          <li>Keyboard accessibility (logical tab order, visible focus states, skip-to-content)</li>
          <li>Color/contrast checks and support for text resizing without loss of content or functionality</li>
          <li>Media alternatives (alt text for images; captions/transcripts for time-based media)</li>
          <li>Regular testing using automated tools and manual checks (e.g., keyboard-only and screen reader spot checks)</li>
        </ul>
        <p>
          Our site is hosted on Wix, and we use Wix and third-party apps. We
          configure available accessibility features and follow Wix guidance as
          part of our ongoing program.
        </p>

        <h2>Measures we take</h2>
        <ul>
          <li>Review new pages/components for contrast, headings, labels, and focus order</li>
          <li>Add alt text for meaningful images and mark decorative images appropriately</li>
          <li>Provide descriptive link text and form error messaging</li>
          <li>Caption new videos where published and provide transcripts on request</li>
          <li>Monitor issues and remediate as part of our release workflow</li>
        </ul>

        <h2>Compatibility and technical requirements</h2>
        <p>
          The Website is designed to work with current versions of major browsers
          (Chrome, Safari, Firefox, Edge) and on modern operating systems
          (Windows, macOS, iOS, Android). It relies on HTML, CSS, and JavaScript;
          assistive technologies that support these should be compatible.
        </p>

        <h2>Known limitations</h2>
        <p>
          Your experience matters. If you need a reasonable accommodation,
          encounter a barrier, or want to report an accessibility issue:
        </p>
        <ul>
          <li>Email: <a href="mailto:rick.hancock@rhconsulting.au">rick.hancock@rhconsulting.au</a></li>
          <li>Phone: 805-505-8807</li>
          <li>Mailing address (optional): Santa Barbara, CA, USA</li>
        </ul>
        <p>
          Please include the page URL, a brief description of the issue, the
          assistive technology or browser you’re using, and your contact details.
          We aim to acknowledge requests within 5 business days and resolve
          issues as promptly as feasible.
        </p>

        <h2>Continuous improvement</h2>
        <p>
          We review this statement and our accessibility program periodically and
          update them as standards and our Website evolve.
        </p>

        <p className="text-sm opacity-70">Last updated: September 16, 2025</p>
      </div>
    </section>
  );
}

