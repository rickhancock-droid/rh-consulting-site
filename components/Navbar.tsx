"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const onCalculator = pathname === "/roi-calculator";

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="RH Consulting" className="h-6 w-auto" />
          <span className="font-semibold text-brand-ink">RH Consulting</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-brand-muted hover:text-brand-ink">Home</Link>
          {!onCalculator && (
            <Link href="/roi-calculator" className="text-brand-muted hover:text-brand-ink">
              ROI Calculator
            </Link>
          )}
        </nav>
      </nav>
    </header>
  );
}

