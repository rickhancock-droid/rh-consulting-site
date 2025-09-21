import Image from "next/image"; // ← at top of app/page.tsx

function ServicesGrid() {
  const cards = [
    {
      href: "/services/automation",
      title: "Automation & Agents",
      desc: "Agentic workflows that remove repetitive load and boost margins.",
      img: "/images/services/automation.jpg", // put file in public/images/services/
      alt: "Workflow automation dashboard",
    },
    {
      href: "/services/ai-consulting",
      title: "AI Consulting",
      desc: "Strategy, roadmaps, and delivery for practical AI that ships.",
      img: "/images/services/consulting.jpg",
      alt: "Consulting session",
    },
    {
      href: "/roi-calculator",
      title: "ROI Calculator",
      desc: "Estimate time and cost savings from AI agents in minutes.",
      img: "/images/services/roi.jpg",
      alt: "ROI analytics",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h2 className="text-2xl font-semibold heading mb-6">What we do</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <a key={c.title} href={c.href} className="card overflow-hidden hover:shadow-card transition-shadow">
            <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800">
              <Image
                src={c.img}
                alt={c.alt}
                fill     // responsive fill inside aspect box
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                className="object-cover"
                priority={c.title === "Automation & Agents"} // one priority image helps LCP
              />
            </div>
            <div className="p-5">
              <h3 className="font-semibold mb-1">{c.title}</h3>
              <p className="muted">{c.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

// In your default export page component, render <ServicesGrid /> where you want it.

