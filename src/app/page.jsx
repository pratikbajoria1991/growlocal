import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, Bot, MapPin, Check, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { BRAND, PRODUCTS, AUDIT_CATEGORIES, HOME_FAQ, HOW_IT_WORKS } from "@/lib/brand";
import { JsonLd, faqSchema, webPageSchema, breadcrumbSchema, howToSchema } from "@/lib/schema";

export const metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.metaDescription,
  alternates: { canonical: BRAND.url },
};

const ICONS = { SEO: Search, AEO: Bot, GEO: MapPin };

export default function Home() {
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/", title: `${BRAND.name} — ${BRAND.tagline}`, description: BRAND.definition })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }])} />
      <JsonLd data={faqSchema(HOME_FAQ)} />
      <JsonLd data={howToSchema({
        name: "How to audit your website for SEO, AEO and GEO",
        description: "Score any website out of 100 on search, AI answer engines and local visibility in under five seconds.",
        totalTime: "PT1M",
        steps: HOW_IT_WORKS,
      })} />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-14 sm:pt-24 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/12 border border-lime-500/25 text-xs text-lime-700 font-medium mb-7">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Free audit · No signup · Results in seconds
          </div>

          <h1 className="font-display text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl tracking-[-0.035em] mb-6 max-w-3xl text-balance">
            Get found on Google,<br />Maps, and <span className="text-lime-600">AI.</span>
          </h1>

          {/* Direct definitional opening — the sentence an answer engine lifts. */}
          <p className="text-lg sm:text-xl text-forest-900/65 mb-9 max-w-2xl leading-relaxed text-pretty">
            {BRAND.definition}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-forest-900 text-canvas-50 font-medium hover:bg-forest-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600 transition-colors"
            >
              Audit my website <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/autopilot"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border hairline bg-white hover:bg-forest-900/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600 font-medium transition-colors"
            >
              See GBP Autopilot
            </Link>
          </div>

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-forest-900/50">
            {["No signup for audits", "Never posts without your approval", "Revoke access anytime"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-lime-600" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Question-format heading #1 */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="max-w-2xl mb-10">
          <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">The problem</div>
          <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.03em] mb-4 text-balance">
            Why is my website invisible to AI search?
          </h2>
          <p className="text-forest-900/65 leading-relaxed text-pretty">
            Because it was built for one surface and there are now three. A customer might Google you, ask Maps for
            somewhere &ldquo;near me&rdquo;, or ask ChatGPT to just name the best option. Each surface reads your site
            differently. Growlocal scores all three and tells you exactly what to fix.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(AUDIT_CATEGORIES).map(([k, m]) => {
            const Icon = ICONS[k];
            return (
              <article key={k} className="rounded-4xl border hairline bg-white p-7 hover:shadow-lift transition-shadow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${m.color}1a` }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} aria-hidden="true" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-1.5" style={{ color: m.color }}>{m.tag}</div>
                <h3 className="font-display text-xl mb-2.5">{m.name}</h3>
                <p className="text-sm text-forest-900/60 leading-relaxed">{m.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Question-format heading #2 — mirrors HowTo schema */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">How it works</div>
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.03em] mb-4 max-w-2xl text-balance">
          How do I audit my website?
        </h2>
        <p className="text-forest-900/65 leading-relaxed mb-10 max-w-2xl text-pretty">
          Paste a URL and read three scores. The whole thing takes under a minute and needs no account.
        </p>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.name} className="border-t-2 border-forest-900/10 pt-4">
              <div className="font-display text-3xl text-lime-600 mb-2">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-medium mb-1.5">{s.name}</h3>
              <p className="text-sm text-forest-900/60 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">What you get</div>
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.03em] mb-10 max-w-2xl text-balance">
          What can Growlocal do for my business?
        </h2>

        <div className="grid md:grid-cols-2 gap-5">
          {PRODUCTS.map((p, i) => (
            <article key={p.id} className={`rounded-4xl p-8 ${i === 1 ? "bg-forest-900 text-canvas-50" : "bg-white border hairline"}`}>
              <div className={`text-[11px] uppercase tracking-[0.15em] mb-2 ${i === 1 ? "text-lime-400" : "text-forest-900/35"}`}>
                {p.name}
              </div>
              <h3 className="font-display text-2xl mb-3">{p.headline}</h3>
              <p className={`text-sm leading-relaxed mb-5 ${i === 1 ? "text-canvas-50/70" : "text-forest-900/60"}`}>{p.blurb}</p>
              <ul className="space-y-2 mb-7">
                {p.bullets.map((b) => (
                  <li key={b} className={`text-sm flex items-start gap-2.5 ${i === 1 ? "text-canvas-50/80" : "text-forest-900/70"}`}>
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-lime-500" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-colors ${
                  i === 1 ? "bg-lime-500 text-forest-900 hover:bg-lime-400" : "bg-forest-900 text-canvas-50 hover:bg-forest-800"
                }`}
              >
                {p.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ — rendered text matches the FAQPage schema above */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">Questions</div>
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.03em] mb-10 text-balance">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-forest-900/[0.07]">
          {HOME_FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                <h3 className="font-display text-lg sm:text-xl leading-snug">{f.q}</h3>
                <span className="mt-1 shrink-0 w-5 h-5 rounded-full border hairline flex items-center justify-center text-forest-900/40 group-open:rotate-45 transition-transform" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-forest-900/70 leading-relaxed text-pretty">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16">
        <div className="rounded-4xl bg-forest-900 text-canvas-50 p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden="true" style={{ background: "radial-gradient(ellipse 60% 70% at 85% 0%, rgba(126,226,62,0.35), transparent 70%)" }} />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.03em] mb-4 text-balance">
              See your score in five seconds.
            </h2>
            <p className="text-canvas-50/70 mb-8 max-w-lg leading-relaxed text-pretty">
              No signup, no card, no sales call. Paste your URL and find out whether Google, Maps and AI can actually see you.
            </p>
            <Link href="/audit" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-lime-500 text-forest-900 font-semibold hover:bg-lime-400 transition-colors">
              Audit my website <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
