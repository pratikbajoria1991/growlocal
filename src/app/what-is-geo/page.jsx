import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "What is GEO (Generative Engine Optimization)?",
  description:
    "GEO covers both generative-AI visibility and geographic/local search signals. Here's what it means for local businesses and the specific schema that drives it.",
};

const FAQ = [
  {
    q: "What is Generative Engine Optimization?",
    a: "Generative Engine Optimization (GEO) is the practice of making your business discoverable and trustworthy to generative AI systems. For local businesses it has a second, geographic dimension: making sure AI and search engines understand exactly where you are and which areas you serve.",
  },
  {
    q: "How is GEO different from AEO?",
    a: "AEO is about format — structuring content so it can be extracted and quoted. GEO is about entity and place — making machines confident about who you are, where you are, and what you serve. In practice AEO wins you the citation and GEO wins you the local match.",
  },
  {
    q: "Why does GEO matter for local businesses?",
    a: "When someone asks an AI assistant for a dentist, a restaurant, or a plumber nearby, the system needs structured geographic data to decide who qualifies. Without LocalBusiness schema, geo coordinates, and areaServed fields, your business is invisible to that query no matter how good your website looks.",
  },
  {
    q: "What is the most important GEO fix?",
    a: "LocalBusiness JSON-LD schema with the @type matching your vertical — Restaurant, Dentist, Hotel, MedicalClinic, and so on — including address, geo coordinates, telephone, openingHoursSpecification, and areaServed. This single block does more for local visibility than any other technical change.",
  },
  {
    q: "Does my address in the footer count?",
    a: "It helps, but it is not enough. Search engines and AI systems read structured data far more reliably than they parse free text. Put your NAP (name, address, phone) in both places, and make sure it matches your Google Business Profile exactly — mismatches actively suppress local rankings.",
  },
];

export default function WhatIsGEO() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">Guide</div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          What is Generative Engine Optimization?
        </h1>

        <p className="text-xl text-forest-900/70 leading-relaxed mb-10">
          GEO is the practice of making your business legible to generative AI systems — and, for local businesses, making machines certain about where you are and who you serve.
        </p>

        <div className="space-y-9 text-forest-900/80 leading-relaxed">
          {FAQ.map((f) => (
            <section key={f.q}>
              <h2 className="font-display text-2xl mb-3">{f.q}</h2>
              <p className="text-[15px]">{f.a}</p>
            </section>
          ))}

          <section>
            <h2 className="font-display text-2xl mb-3">The GEO checklist</h2>
            <ol className="list-decimal pl-5 space-y-2.5 text-[15px]">
              <li><strong>LocalBusiness schema</strong> with the most specific @type for your vertical.</li>
              <li><strong>PostalAddress</strong> matching your Google Business Profile character for character.</li>
              <li><strong>GeoCoordinates</strong> — right-click your location in Google Maps to copy exact lat/long.</li>
              <li><strong>areaServed</strong> listing every locality you serve, not just where you sit.</li>
              <li><strong>openingHoursSpecification</strong> so you appear in &quot;open now&quot; filters.</li>
              <li><strong>A tap-to-call link</strong> — <code className="text-xs bg-forest-900/5 px-1.5 py-0.5 rounded">tel:</code> href in your header and footer.</li>
              <li><strong>Location language in your copy</strong> — name your city and neighbourhood in the H1 and first paragraph.</li>
            </ol>
          </section>
        </div>

        <div className="mt-12 rounded-4xl bg-forest-900 text-canvas-50 p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 70% at 90% 0%, rgba(245,158,11,0.3), transparent 70%)" }} />
          <div className="relative">
            <h2 className="font-display text-2xl mb-3">Check your GEO score free</h2>
            <p className="text-canvas-50/70 mb-6 leading-relaxed max-w-md">We check every item on this list and tell you exactly what to add.</p>
            <Link href="/audit" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-lime-500 text-forest-900 font-semibold text-sm hover:bg-lime-400 transition-colors">
              Run free audit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
