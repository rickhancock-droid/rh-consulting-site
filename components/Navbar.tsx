"use client";

import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import SocialIcons from "./SocialIcons";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2" aria-label="RH Consulting home">
          {/* Black chip ensures white-on-black logo has contrast in light mode */}
          <span className="relative h-8 w-8 rounded-xl bg-black dark:bg-transparent">
            <Image src="/logo.png" alt="RH Consulting logo" fill className="object-contain p-1" />
          </span>
          <span className="sr-only">RH Consulting</span>
        </a>

        {/* ...keep your existing nav links, CTA, ThemeToggle, etc. */}
      </div>

      {/* Optional: socials on mobile */}
      <div className="sm:hidden px-6 pb-2">
        <SocialIcons />
      </div>
    </nav>
  );
}

