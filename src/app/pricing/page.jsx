import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { BRAND, PLANS } from "@/lib/brand";

export const metadata = {
  title: "Pricing",
  description: `${BRAND.name} pricing. Free unlimited SEO/AEO/GEO audits. GBP Autopilot from ₹4,999/month.`,
};

export default function Pricing() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-10 text-center">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">Pricing</div>
        <h1 className="font-display text-4xl sm:text-6xl leading-[1.02] tracking-tight mb-4">
          Audits are free. <span className="text-lime-600">Forever.</span>
        </h1>
        <p className="text-lg text-forest-900/60 max-w-xl mx-auto leading-relaxed">
          Pay only when you want the AI agent to do the work for you. Cancel anytime — no lock-in, no minimum term.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`rounded-4xl p-8 flex flex-col ${
                p.featured ? "bg-forest-900 text-canvas-50 shadow-glow" : "bg-white border hairline"
              }`}
            >
              {p.featured && (
                <div className="self-start px-2 py-0.5 rounded-md bg-lime-500 text-forest-900 text-[10px] uppercase tracking-wider font-bold mb-4">
                  Most popular
                </div>
              )}
              <div className={`text-[11px] uppercase tracking-[0.15em] mb-2 ${p.featured ? "text-canvas-50/45" : "text-forest-900/35"}`}>
                {p.name}
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="font-display text-4xl">{p.price}</span>
                <span className={`text-sm ${p.featured ? "text-canvas-50/50" : "text-forest-900/45"}`}>{p.cadence}</span>
              </div>
              <p className={`text-sm mb-6 leading-relaxed ${p.featured ? "text-canvas-50/70" : "text-forest-900/60"}`}>{p.tagline}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className={`text-sm flex items-start gap-2.5 ${p.featured ? "text-canvas-50/80" : "text-forest-900/70"}`}>
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-lime-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={p.href}
                className={`text-center px-5 py-3 rounded-xl font-medium text-sm transition-colors inline-flex items-center justify-center gap-2 ${
                  p.featured
                    ? "bg-lime-500 text-forest-900 hover:bg-lime-400"
                    : "bg-forest-900 text-canvas-50 hover:bg-forest-800"
                }`}
              >
                {p.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-forest-900/40 mt-8">
          Prices exclude GST. Monthly plans cancel with 30 days notice.
        </p>
      </section>
    </>
  );
}
