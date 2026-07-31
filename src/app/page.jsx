import Link from "next/link";
import { ArrowRight, Search, Bot, MapPin, Check, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { BRAND, PRODUCTS, AUDIT_CATEGORIES } from "@/lib/brand";

export const metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.pitch,
};

const ICONS = { SEO: Search, AEO: Bot, GEO: MapPin };

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-16 sm:pt-28 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/12 border border-lime-500/25 text-xs text-lime-600 font-medium mb-7">
            <Sparkles className="w-3 h-3" />
            Audit + Autopilot in one tool
          </div>

          <h1 className="font-display text-5xl sm:text-7xl leading-[0.98] tracking-tight mb-6 max-w-3xl">
            Get found on Google,<br />Maps, and <span className="text-lime-600">AI.</span>
          </h1>

          <p className="text-lg sm:text-xl text-forest-900/60 mb-9 max-w-2xl leading-relaxed">
            {BRAND.pitch}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-14">
            <Link href="/audit" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-forest-900 text-canvas-50 font-medium hover:bg-forest-800 transition-colors">
              Run a free audit <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/autopilot" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border hairline bg-white hover:bg-forest-900/[0.03] font-medium transition-colors">
              See GBP Autopilot
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-forest-900/45">
            <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-lime-600" /> No signup for audits</span>
            <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-lime-600" /> Never posts without your approval</span>
            <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-lime-600" /> Revoke access anytime</span>
          </div>
        </div>
      </section>

      {/* Three surfaces */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="max-w-2xl mb-10">
          <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">The problem</div>
          <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-tight mb-4">
            Search isn't one surface anymore.
          </h2>
          <p className="text-forest-900/60 leading-relaxed">
            Your customers find businesses three different ways now — a Google search, a Maps &quot;near me&quot;, or by asking an AI. Most sites are only built for the first one. Growlocal scores all three and tells you exactly what to fix.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(AUDIT_CATEGORIES).map(([k, m]) => {
            const Icon = ICONS[k];
            return (
              <div key={k} className="rounded-4xl border hairline bg-white p-7">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${m.color}1a` }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
                <div className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-1.5" style={{ color: m.color }}>{m.tag}</div>
                <h3 className="font-display text-xl mb-2.5">{m.name}</h3>
                <p className="text-sm text-forest-900/60 leading-relaxed">{m.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two products */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">What you get</div>
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-tight mb-10 max-w-2xl">
          Diagnose it free. Then let AI run it.
        </h2>

        <div className="grid md:grid-cols-2 gap-5">
          {PRODUCTS.map((p, i) => (
            <div key={p.id} className={`rounded-4xl p-8 ${i === 1 ? "bg-forest-900 text-canvas-50" : "bg-white border hairline"}`}>
              <div className={`text-[11px] uppercase tracking-[0.15em] mb-2 ${i === 1 ? "text-lime-400" : "text-forest-900/35"}`}>
                {p.name}
              </div>
              <h3 className="font-display text-2xl mb-3">{p.headline}</h3>
              <p className={`text-sm leading-relaxed mb-5 ${i === 1 ? "text-canvas-50/70" : "text-forest-900/60"}`}>{p.blurb}</p>
              <ul className="space-y-2 mb-7">
                {p.bullets.map((b) => (
                  <li key={b} className={`text-sm flex items-start gap-2.5 ${i === 1 ? "text-canvas-50/80" : "text-forest-900/70"}`}>
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-lime-500" />
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
                {p.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How autopilot works */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">How Autopilot works</div>
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-tight mb-10 max-w-2xl">
          Connect once. Approve weekly.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: "01", t: "Connect", d: "Authorise your Google Business Profile through Google's own consent screen. We never see your password.", icon: ShieldCheck },
            { n: "02", t: "Agent drafts", d: "An AI agent writes your weekly posts, review replies, FAQ content and schema — based on your actual business.", icon: Bot },
            { n: "03", t: "You approve", d: "Everything lands in your dashboard as a draft. Nothing publishes until you say so.", icon: Check },
            { n: "04", t: "Report ships", d: "On the 1st of every month, a report showing what changed, what moved, and what's next.", icon: Zap },
          ].map((s) => (
            <div key={s.n} className="border-t-2 border-forest-900/10 pt-4">
              <div className="font-display text-3xl text-lime-600 mb-2">{s.n}</div>
              <div className="font-medium mb-1.5">{s.t}</div>
              <p className="text-sm text-forest-900/60 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16">
        <div className="rounded-4xl bg-forest-900 text-canvas-50 p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 70% at 85% 0%, rgba(126,226,62,0.35), transparent 70%)" }} />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] mb-4">
              Start with a free audit.
            </h2>
            <p className="text-canvas-50/70 mb-8 max-w-lg leading-relaxed">
              No signup, no card, no sales call. Paste your URL and see your three scores in seconds.
            </p>
            <Link href="/audit" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-lime-500 text-forest-900 font-semibold hover:bg-lime-400 transition-colors">
              Audit my website <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
