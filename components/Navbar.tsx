"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const onCalculator = pathname === "/roi-calculator";

  return (
    <header className="sticky top-0 z-50 bg-white border-b dark:bg-slate-950 dark:border-slate-800">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* Swap to your orange logo */}
          <img
            src="/images/logo-orange.png"
            alt="RH Consulting"
            className="h-6 w-auto"
          />
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            RH Consulting
          </span>
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Home
          </Link>
          {!onCalculator && (
            <Link
              href="/roi-calculator"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            <Link
              href="/glossary" className="hover:opacity-80">Glossary</Link>
            >
              ROI Calculator
            </Link>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

