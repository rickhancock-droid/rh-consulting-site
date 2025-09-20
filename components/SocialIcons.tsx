"use client";

type Props = { size?: number; className?: string };

export default function SocialIcons({ size = 22, className = "" }: Props) {
  const links = {
    facebook: "https://facebook.com/your-page",             // replace with your real URL
    linkedin: "https://www.linkedin.com/company/your-company", // replace
    x: "https://x.com/your-handle",                         // replace
  };
  const a = "opacity-80 hover:opacity-100 transition";
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <a href={links.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer" className={a} title="Facebook">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06C2 17.05 5.66 21.2 10.4 22v-7.03H7.9v-2.9h2.5V9.83c0-2.47 1.47-3.84 3.72-3.84 1.08 0 2.2.19 2.2.19v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54v1.86h2.72l-.43 2.9h-2.29V22C18.34 21.2 22 17.05 22 12.06z"/></svg>
      </a>
      <a href={links.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className={a} title="LinkedIn">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zM8 8h3.8v2.2h.06c.53-1 1.86-2.2 3.84-2.2 4.1 0 4.86 2.7 4.86 6.2V24h-4V15.6c0-2-.03-4.6-2.8-4.6-2.8 0-3.2 2.2-3.2 4.5V24H8V8z"/></svg>
      </a>
      <a href={links.x} aria-label="X (Twitter)" target="_blank" rel="noopener noreferrer" className={a} title="X">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2H21.5l-7.51 8.58L22.5 22h-5.98l-4.68-5.5L6.3 22H3l8.05-9.2L1.5 2h6.08l4.22 5.1L18.244 2zm-1.05 18h1.64L7.87 4H6.14l11.054 16z"/></svg>
      </a>
    </div>
  );
}

