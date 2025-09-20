"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const onCalculator = pathname === "/roi-calculator";

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="RH Consulting" className="h-6 w-auto" />
          <span className="font-semibold text-brand-ink">RH Consulting</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-brand-muted hover:text-brand-ink">Home</Link>
          {!onCalculator && (
            <Link href="/roi-calculator" className="text-brand-muted hover:text-brand-ink">
              ROI Calculator
            </Link>
          )}
          {!onCalculator && (
            <a
              href="/roi-calculator"
              className="px-3 py-1.5 rounded-2xl bg-brand-primary hover:bg-brand-primaryDark text-white shadow-sm"
            >
              Try the Calculator
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}

