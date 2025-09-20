export default function Head() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI ROI Calculator",
    applicationCategory: "BusinessApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    creator: {
      "@type": "LocalBusiness",
      name: "RH Consulting",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Santa Barbara",
        addressRegion: "CA",
        addressCountry: "US"
      }
    },
    url: "https://www.rhconsulting.ai/roi-calculator"
  };

  return (
    <>
      <title>AI ROI Calculator | RH Consulting</title>
      <meta
        name="description"
        content="Estimate hours saved, labor savings, ROI and payback from AI automation and support deflection. Export results or book a call with pre-filled metrics."
      />
      <meta name="robots" content="index,follow" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}

