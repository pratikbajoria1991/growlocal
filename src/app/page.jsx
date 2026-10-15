import Link from "next/link";
import {
  ArrowRight, Search, Bot, MapPin, Check, Sparkles, MessageCircle, FileText, LineChart,
  Radar, Route, Users, ScanSearch, FlaskConical, BookCheck, ShieldCheck, UserCheck, HandHelping, Scale,
} from "lucide-react";
import { BRAND, PRODUCTS, WEBSITE_AUDIT_CATEGORIES, HOME_FAQ, HOW_IT_WORKS } from "@/lib/brand";
import { MARKET } from "@/lib/market-data";
import { JsonLd, faqSchema, webPageSchema, breadcrumbSchema, howToSchema } from "@/lib/schema";
import { HeroForm } from "@/components/home/HeroForm";
import { ReportMock } from "@/components/home/ReportMock";
import { Reveal } from "@/components/home/Reveal";
import { CountUp } from "@/components/home/CountUp";

export const metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.metaDescription,
  alternates: { canonical: BRAND.url },
};

const ICONS = { SEO: Search, AEO: Bot, GEO: MapPin };

const WEEK = [
  { icon: FileText, t: "Your profile stays active", d: "New posts, current services and fresh photos on your Google Business Profile." },
  { icon: MessageCircle, t: "Reviews get answered", d: "Positive reviews get a reply. Negative ones are drafted and sent to you on WhatsApp first." },
  { icon: Search, t: "Your website gets fixed", d: "FAQ and schema added so Google and AI assistants can understand and quote you." },
  { icon: LineChart, t: "You see what changed", d: "A monthly report from your own Google numbers: calls, directions and website clicks." },
];

// Each stat is a measured aggregate from our own audits (src/lib/market-data.js).
const STATS = [
  { n: MARKET.aeoBelow50, s: "%", t: "of websites are unreadable to AI assistants", d: `scored under 50/100 for answer-engine readiness (${MARKET.auditedSites.toLocaleString("en-IN")} sites audited)` },
  { n: MARKET.notInTop20, s: "%", t: "don’t appear in Google’s top 20", d: `for their own category + neighbourhood (${MARKET.rankedSearches.toLocaleString("en-IN")} live searches)` },
  { n: MARKET.reviewGap, s: "%", t: "have far fewer reviews than the top results", d: "at least 1.5× fewer than the top 3 for the same search" },
  { n: MARKET.noWebsite, s: "%", t: "link no website at all on Google", d: `and ${MARKET.deadSites} more link one that no longer loads` },
];

const CREW = [
  { icon: Radar, t: "Discover", d: "Measures your live Google profile, your nearest competitors and your website. Every issue comes with a number." },
  { icon: Route, t: "Plan", d: "A lead strategist ranks the issues for your goal and hands each to the right specialist." },
  { icon: Users, t: "Do", d: "GBP, SEO, AEO and GEO specialists draft fixes in parallel: profile copy, schema, FAQ answers and page titles." },
  { icon: ScanSearch, t: "Check", d: "Three independent checks per draft: rules in code, a fact-checking agent, and a second model. Anything unsupported is cut." },
  { icon: FlaskConical, t: "Prove", d: "Website fixes are applied to a copy of your page and re-scored with the same audit, so you see the before and after." },
  { icon: BookCheck, t: "Record", d: "Everything is logged. Safe changes ship; name, category, hours and review replies wait for your OK." },
];

const PRINCIPLES = [
  { icon: Scale, t: "Facts only", d: "Every sentence we write about you traces to a measured Google number or something you told us. If we don’t know, we ask. We never invent services, prices, awards or reviews." },
  { icon: UserCheck, t: "You stay in control", d: "Low-risk work (posts, schema, technical fixes) just happens. Anything that can hurt a profile waits for your approval: name, category, address, hours, and replies to negative reviews." },
  { icon: ShieldCheck, t: "Measured, not promised", d: "We don’t promise rankings. We show before-and-after audit scores and your own Google numbers, and say plainly what we can’t measure yet." },
];

export default function Home() {
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/", title: `${BRAND.name} — ${BRAND.tagline}`, description: BRAND.definition })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }])} />
      <JsonLd data={faqSchema(HOME_FAQ)} />
      <JsonLd data={howToSchema({
        name: "How Growlocal handles your local marketing",
        description: "From a free audit to weekly done-for-you work and a monthly results report.",
        steps: HOW_IT_WORKS,
      })} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
          <div>
            <a href="#data" className="inline-flex items-center gap-1.5 text-sm text-forest-900/65 hover:text-indigo-700 underline-offset-4 hover:underline mb-6">
              We audited {MARKET.businesses.toLocaleString("en-IN")} Kolkata businesses. See what we found <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>

            <h1 className="font-display text-[2.4rem] leading-[1.04] sm:text-5xl lg:text-[3.6rem] tracking-[-0.04em] mb-6 text-balance">
              When customers ask Google or ChatGPT, be the name it gives.
            </h1>

            <p className="text-lg sm:text-xl text-forest-900/65 mb-8 max-w-xl leading-relaxed text-pretty">
              Growlocal is a done-for-you local marketing service. It audits how you show up on Google Maps, search and AI assistants, then fixes it every week. Anything risky waits for your OK.
            </p>

            <HeroForm />

            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-forest-900/70">
              {["No agency retainer", "No dashboard to learn", "Built in Kolkata"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <Reveal enabled y={28} delay={0.1}>
            <div className="lg:ml-auto max-w-md mx-auto lg:max-w-none">
              <ReportMock />
            </div>
          </Reveal>
        </div>
      </section>

      {/* The data — real, aggregated, dated */}
      <section id="data" className="bg-forest-900 text-canvas-50 relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <Reveal>
            <p className="text-sm text-indigo-300 mb-3">The state of local visibility in {MARKET.city}</p>
            <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-4 max-w-3xl text-balance">
              We audited {MARKET.businesses.toLocaleString("en-IN")} local businesses. <span className="text-indigo-300">Most websites are unreadable to the AI assistants customers now ask.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-canvas-50/10 rounded-3xl overflow-hidden border border-canvas-50/10">
            {STATS.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.06} className="bg-forest-900 p-7">
                <div className="font-display text-6xl sm:text-7xl tracking-[-0.04em] text-indigo-200 leading-none mb-4"><CountUp to={s.n} suffix={s.s} /></div>
                <div className="font-medium mb-1.5 leading-snug">{s.t}</div>
                <div className="text-sm text-canvas-50/75 leading-relaxed">{s.d}</div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-xs text-canvas-50/70 max-w-3xl leading-relaxed">
            Method: live Google Maps data and our own SEO/AEO/GEO website audit, run {MARKET.asOf} on {MARKET.businesses.toLocaleString("en-IN")} unique Kolkata
            businesses — clinics, dental and eye care, fertility, interiors, real estate, salons and professional services. This is the set we chose to
            audit, not a random sample of every business in the city. Search position is one Google search per business; it varies by where the customer stands.
          </p>
        </div>
      </section>

      {/* Three surfaces */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <Reveal className="max-w-2xl mb-10">
          <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-4 text-balance">
            Three places. Each reads your business differently.
          </h2>
          <p className="text-forest-900/65 leading-relaxed text-pretty">
            Google search, Google Maps, and AI assistants that simply name two or three options. Keeping all three current is a weekly job most owners
            don&apos;t have time for. That job is what we take off your hands.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(WEBSITE_AUDIT_CATEGORIES).map(([k, m], i) => {
            const Icon = ICONS[k];
            return (
              <Reveal key={k} delay={i * 0.07}>
                <article className="h-full rounded-4xl border hairline bg-white p-7 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${m.color}1a` }}>
                    <Icon className="w-5 h-5" style={{ color: m.color }} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-forest-900/70 mb-1.5">{m.tag}</p>
                  <h3 className="font-display text-xl mb-2.5">{m.name}</h3>
                  <p className="text-sm text-forest-900/60 leading-relaxed">{m.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* The crew */}
      <section className="border-y hairline bg-white/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-4 text-balance">
              A team of specialist AI agents. <span className="text-indigo-600">Checked by code, then by you.</span>
            </h2>
            <p className="text-forest-900/65 leading-relaxed text-pretty">
              One goal, six stages. The agents draft; independent checks decide what survives; your own audit proves it worked before anything ships.
            </p>
          </Reveal>
          <ol className="relative max-w-3xl border-l-2 border-indigo-600/20 ml-3 space-y-8">
            {CREW.map((c, i) => (
              <li key={c.t} className="relative pl-8">
                <span className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-white border-2 border-indigo-600 text-indigo-700 text-sm font-semibold flex items-center justify-center tabular-nums">{i + 1}</span>
                <h3 className="font-display text-xl mb-1 flex items-center gap-2"><c.icon className="w-4 h-4 text-indigo-600" aria-hidden="true" />{c.t}</h3>
                <p className="text-forest-900/65 leading-relaxed max-w-xl">{c.d}</p>
              </li>
            ))}
          </ol>
          <Reveal className="mt-8 flex flex-wrap gap-2 text-xs text-forest-900/75">
            {[[ShieldCheck, "We do it: low-risk work that ships on its own"], [UserCheck, "You approve: name, category, hours, sensitive replies"], [HandHelping, "We need you: photos and review requests"]].map(([I, t]) => (
              <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border hairline bg-white"><I className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />{t}</span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Principles + definition */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <Reveal className="max-w-3xl mb-10">
          <p className="font-display text-2xl sm:text-3xl leading-snug tracking-[-0.02em] text-balance">{BRAND.definition}</p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-x-10 gap-y-8">
          {PRINCIPLES.map((p) => (
            <div key={p.t} className="border-t-2 border-forest-900 pt-5">
              <h3 className="font-display text-xl mb-2 flex items-center gap-2"><p.icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />{p.t}</h3>
              <p className="text-forest-900/65 leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A week with Growlocal */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
        <Reveal>
          <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-10 max-w-2xl text-balance">
            What does Growlocal do for my business?
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WEEK.map((w, i) => (
            <Reveal key={w.t} delay={i * 0.06}>
              <div className="h-full rounded-4xl border hairline bg-white p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/12 flex items-center justify-center mb-4">
                  <w.icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg mb-2">{w.t}</h3>
                <p className="text-sm text-forest-900/60 leading-relaxed">{w.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works — mirrors HowTo schema */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-10 max-w-2xl text-balance">
          How do I get started?
        </h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.name} className="border-t-2 border-forest-900/10 pt-4">
              <div className="font-display text-3xl text-indigo-600 mb-2">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-medium mb-1.5">{s.name}</h3>
              <p className="text-sm text-forest-900/60 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-10 max-w-2xl text-balance">
          Start free. Hand it over when you&apos;re ready.
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {PRODUCTS.map((p, i) => (
            <article key={p.id} className={`rounded-4xl p-8 ${i === 1 ? "bg-forest-900 text-canvas-50" : "bg-white border hairline"}`}>
              <div className={`text-sm mb-2 ${i === 1 ? "text-indigo-300" : "text-forest-900/65"}`}>
                {p.name}{p.statusNote ? ` · ${p.statusNote}` : ""}
              </div>
              <h3 className="font-display text-2xl mb-3">{p.headline}</h3>
              <p className={`text-sm leading-relaxed mb-5 ${i === 1 ? "text-canvas-50/70" : "text-forest-900/60"}`}>{p.blurb}</p>
              <ul className="space-y-2 mb-7">
                {p.bullets.map((b) => (
                  <li key={b} className={`text-sm flex items-start gap-2.5 ${i === 1 ? "text-canvas-50/80" : "text-forest-900/70"}`}>
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-colors ${i === 1 ? "btn-premium text-white" : "bg-forest-900 text-canvas-50 hover:bg-forest-800"}`}
              >
                {p.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ — rendered text matches the FAQPage schema above */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-10 text-balance">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-forest-900/[0.07]">
          {HOME_FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                <h3 className="font-display text-lg sm:text-xl leading-snug">{f.q}</h3>
                <span className="mt-1 shrink-0 w-5 h-5 rounded-full border hairline flex items-center justify-center text-forest-900/65 group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-forest-900/70 leading-relaxed text-pretty">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16">
        <div className="rounded-4xl bg-forest-900 text-canvas-50 p-10 sm:p-14 relative overflow-hidden">
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-4 text-balance">See what&apos;s costing you customers.</h2>
            <p className="text-canvas-50/70 mb-8 max-w-lg leading-relaxed text-pretty">
              Start with the free audit. No signup, no sales call. If you&apos;d rather not fix it yourself, we&apos;ll handle it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/audit" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl btn-premium text-white font-semibold">
                Get my free audit <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/managed#apply" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-canvas-50/20 hover:bg-canvas-50/10 font-medium transition-colors">
                Apply for a founding slot
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
