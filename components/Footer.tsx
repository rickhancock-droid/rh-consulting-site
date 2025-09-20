import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-brand-muted flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>© {new Date().getFullYear()} RH Consulting</div>
        <nav className="flex gap-4">
          <Link className="hover:text-brand-ink" href="/privacy">Privacy</Link>
          <Link className="hover:text-brand-ink" href="/accessibility">Accessibility</Link>
          <Link className="hover:text-brand-ink" href="/roi-calculator">ROI Calculator</Link>
        </nav>
      </div>
    </footer>
  );
}

