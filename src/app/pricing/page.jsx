import Link from "next/link";
import { Check, ArrowRight, Clock } from "lucide-react";
import { BRAND, PLANS, HOW_IT_WORKS } from "@/lib/brand";
import { JsonLd, webPageSchema, breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { FaqSection } from "@/components/FaqSection";
import { PRICING_FAQ } from "@/lib/page-faq";

const TITLE = "Pricing: free audit, managed from ₹4,999";
const DESCRIPTION = `${BRAND.name} pricing. Free visibility audits. Done-for-you local marketing at ₹4,999 per location per month, with no agency retainer.`;

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BRAND.url}/pricing` },
};

const BADGE = {
  live: { label: "Live now", cls: "bg-emerald-700 text-white" },
  founding: { label: "Founding clients", cls: "bg-canvas-50/15 text-canvas-50" },
  talk: { label: "By conversation", cls: "bg-forest-900/8 text-forest-900/70" },
};

export default function Pricing() {
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/pricing", title: TITLE, description: DESCRIPTION })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }])} />
      <JsonLd data={faqSchema(PRICING_FAQ)} />
      <JsonLd data={howToSchema({
        name: "How to get started with Growlocal",
        description: "From a free audit to weekly work and a monthly results report.",
        steps: HOW_IT_WORKS,
      })} />

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-10 text-center">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">Pricing</div>
        <h1 className="font-display text-4xl sm:text-6xl leading-[1.02] tracking-tight mb-4 text-balance">
          Less than an agency. <span className="text-indigo-600">None of the work.</span>
        </h1>
        <p className="text-lg text-forest-900/60 max-w-xl mx-auto leading-relaxed text-pretty">
          Growlocal&apos;s visibility audit is free. When you want your local marketing handled every week, it&apos;s one flat
          price per location, month to month, with no long contract.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((p) => {
            const badge = BADGE[p.status] || BADGE.talk;
            return (
              <div
                key={p.id}
                className={`rounded-4xl p-8 flex flex-col ${
                  p.featured ? "bg-forest-900 text-canvas-50 shadow-glow" : "bg-white border hairline"
                }`}
              >
                <div className={`self-start px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold mb-4 ${badge.cls}`}>
                  {badge.label}
                </div>
                <div className={`text-[11px] uppercase tracking-[0.15em] mb-2 ${p.featured ? "text-canvas-50/75" : "text-forest-900/65"}`}>
                  {p.name}
                </div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="font-display text-4xl">{p.price}</span>
                  <span className={`text-sm ${p.featured ? "text-canvas-50/75" : "text-forest-900/65"}`}>{p.cadence}</span>
                </div>
                <p className={`text-sm mb-6 leading-relaxed ${p.featured ? "text-canvas-50/70" : "text-forest-900/60"}`}>{p.tagline}</p>

                <ul className="space-y-2.5 mb-5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className={`text-sm flex items-start gap-2.5 ${p.featured ? "text-canvas-50/80" : "text-forest-900/70"}`}>
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Roadmap items render visibly apart from features — a planned
                    thing must never be mistaken for a thing you're paying for. */}
                {p.planned?.length > 0 && (
                  <div className={`mb-8 pt-4 border-t ${p.featured ? "border-canvas-50/15" : "border-forest-900/8"}`}>
                    <div className={`text-[10px] uppercase tracking-[0.12em] font-semibold mb-2.5 ${p.featured ? "text-canvas-50/75" : "text-forest-900/65"}`}>
                      Planned, not included yet
                    </div>
                    <ul className="space-y-2">
                      {p.planned.map((f) => (
                        <li key={f} className={`text-xs flex items-start gap-2.5 ${p.featured ? "text-canvas-50/75" : "text-forest-900/65"}`}>
                          <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href={p.href}
                  className={`text-center px-5 py-3 rounded-xl font-medium text-sm transition-colors inline-flex items-center justify-center gap-2 ${
                    p.featured
                      ? "btn-premium text-white"
                      : "bg-forest-900 text-canvas-50 hover:bg-forest-800"
                  }`}
                >
                  {p.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-forest-900/65 mt-8">
          Prices exclude GST. Managed plans bill monthly and cancel with 30 days notice. No payment is taken on this site —
          founding clients are invoiced after an onboarding call.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-10 text-balance">
          How do I get started?
        </h2>
        <ol className="space-y-6">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.name} className="flex gap-4">
              <span className="font-display text-xl text-indigo-600 w-6 shrink-0" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="font-display text-lg leading-snug mb-1">{s.name}</h3>
                <p className="text-forest-900/65 leading-relaxed text-pretty">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <FaqSection items={PRICING_FAQ} heading="Pricing questions, answered" />
    </>
  );
}
