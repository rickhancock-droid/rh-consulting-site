"use client";
import Link from "next/link";
export function Button({ href, children, variant="primary" }:{
  href:string; children:React.ReactNode; variant?: "primary"|"ghost"
}) {
  const cls = variant==="primary"
    ? "inline-flex items-center px-5 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primaryDark"
    : "inline-flex items-center px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900";
  return <Link href={href} className={cls}>{children}</Link>;
}

