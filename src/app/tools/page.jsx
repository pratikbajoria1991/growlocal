import Link from "next/link";
import { Eye, Package, Scale, Link2, ScanSearch, Search, MapPin, Sparkles, Gauge, ArrowRight } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { BRAND } from "@/lib/brand";
import { JsonLd, webPageSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { FaqSection } from "@/components/FaqSection";
import { TOOLS_FAQ } from "@/lib/page-faq";

const ICONS = { Eye, Package, Scale, Link2, ScanSearch, Search, MapPin, Sparkles, Gauge };

export const metadata = {
  title: "Free SEO, Maps & AI visibility tools",
  description: "Free SEO tools for local businesses: site audit, keyword research, Google Maps rank checker, AI answer check, speed test and backlink finder. No signup.",
  alternates: { canonical: `${BRAND.url}/tools` },
};

export default function ToolsIndex() {
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/tools", title: "Free SEO, Maps & AI visibility tools", description: metadata.description })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }])} />
      <JsonLd data={faqSchema(TOOLS_FAQ)} />

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">Free tools</div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.03] tracking-[-0.03em] mb-5 text-balance">
          Free tools, no signup
        </h1>
        <p className="text-lg text-forest-900/65 leading-relaxed max-w-2xl text-pretty">
          Growlocal&apos;s free tools each answer one question about how customers find you: on Google, on Google Maps and in AI
          answers. Every result comes from live data at the moment you run it, and each tool says plainly what it can&apos;t see.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <ul className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map((t) => {
            const Icon = ICONS[t.icon];
            return (
              <li key={t.slug}>
                <Link
                  href={`/tools/${t.slug}`}
                  className="group flex flex-col h-full rounded-4xl border hairline bg-white p-6 hover:shadow-lift hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${t.color}1a` }}>
                    <Icon className="w-5 h-5" style={{ color: t.color }} aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-lg mb-1.5">{t.name}</h2>
                  <p className="text-sm font-medium text-forest-900/70 mb-2">{t.tagline}</p>
                  <p className="text-sm text-forest-900/70 leading-relaxed flex-1">{t.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700">
                    Open tool <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}

          <li>
            <Link
              href="/audit"
              className="group flex flex-col h-full rounded-4xl bg-forest-900 text-canvas-50 p-6 hover:-translate-y-0.5 transition-transform relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" style={{ background: "radial-gradient(ellipse 60% 70% at 90% 0%, rgba(126,226,62,0.35), transparent 70%)" }} />
              <div className="relative flex flex-col h-full">
                <div className="text-[11px] uppercase tracking-[0.15em] text-indigo-400 mb-2">Full audit</div>
                <h2 className="font-display text-lg mb-2">Score all three surfaces at once</h2>
                <p className="text-sm text-canvas-50/70 leading-relaxed flex-1">
                  SEO, AEO and GEO scored out of 100 each, with every check listed and the fix spelled out. Takes about
                  five seconds.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400">
                  Run full audit <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </section>

      <FaqSection items={TOOLS_FAQ} />
    </>
  );
}
