"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ArrowRight, Loader2, AlertCircle, ArrowLeft, RotateCcw, TrendingUp, TrendingDown, Minus, Wrench } from "lucide-react";
import { AUDIT_CATEGORIES } from "@/lib/brand";

export default function CompareTool() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!a.trim() || !b.trim()) return;
    setLoading(true); setError(null); setRes(null);
    try {
      const r = await fetch("/api/tools/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: a.trim(), b: b.trim() }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error || "Compare failed.");
      else setRes(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-12 pb-20">
      <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-forest-900/50 hover:text-forest-900 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All tools
      </Link>

      <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center mb-5" style={{ background: "rgba(245,158,11,0.15)" }}>
        <Scale className="w-5 h-5" style={{ color: "#f59e0b" }} aria-hidden="true" />
      </div>

      <h1 className="font-display text-3xl sm:text-4xl leading-[1.05] tracking-[-0.03em] mb-4 text-balance">
        How do you compare to a competitor?
      </h1>
      <p className="text-forest-900/65 leading-relaxed mb-8 text-pretty">
        We audit both sites and show which checks they pass that you don&apos;t — ranked by the points you&apos;d recover
        from closing each gap. Both audits run in parallel, so it takes about as long as one.
      </p>

      <form onSubmit={submit} className="mb-8 space-y-3">
        <div>
          <label htmlFor="cmp-a" className="block text-xs text-forest-900/55 mb-1.5">Your website</label>
          <input
            id="cmp-a" type="text" inputMode="url" value={a} onChange={(e) => setA(e.target.value)}
            placeholder="yourbusiness.com" disabled={loading} suppressHydrationWarning
            className="w-full px-4 py-3 rounded-xl border hairline bg-white outline-none focus:border-lime-500/60 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="cmp-b" className="block text-xs text-forest-900/55 mb-1.5">Their website</label>
          <input
            id="cmp-b" type="text" inputMode="url" value={b} onChange={(e) => setB(e.target.value)}
            placeholder="competitor.com" disabled={loading} suppressHydrationWarning
            className="w-full px-4 py-3 rounded-xl border hairline bg-white outline-none focus:border-lime-500/60 transition-colors"
          />
        </div>
        <button
          type="submit" disabled={loading || !a.trim() || !b.trim()}
          className="w-full px-5 py-3.5 rounded-xl bg-forest-900 text-canvas-50 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-forest-800 transition-colors"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Auditing both…</> : <>Compare <ArrowRight className="w-4 h-4" aria-hidden="true" /></>}
        </button>
        {error && (
          <p className="flex items-start gap-2 text-sm text-rose-600">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> {error}
          </p>
        )}
      </form>

      <AnimatePresence>
        {res && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Head to head */}
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <SideCard label="You" data={res.you} winner={res.overallDelta > 0} />
              <SideCard label="Them" data={res.them} winner={res.overallDelta < 0} />
            </div>

            <div className={`rounded-2xl p-4 mb-8 text-sm leading-relaxed ${res.overallDelta >= 0 ? "bg-lime-500/[0.08] border border-lime-500/25" : "bg-rose-500/[0.05] border border-rose-500/25"}`}>
              {res.overallDelta > 0 && <>You&apos;re ahead by <strong>{res.overallDelta} points</strong> overall.</>}
              {res.overallDelta === 0 && <>You&apos;re dead level on overall score.</>}
              {res.overallDelta < 0 && <>They&apos;re ahead by <strong>{Math.abs(res.overallDelta)} points</strong> overall. The gaps below are how you close it.</>}
            </div>

            {/* Per-category */}
            <h2 className="font-display text-lg mb-3">Category by category</h2>
            <ul className="space-y-2 mb-8">
              {res.deltas.map((d) => {
                const m = AUDIT_CATEGORIES[d.category];
                const Icon = d.delta > 0 ? TrendingUp : d.delta < 0 ? TrendingDown : Minus;
                const tone = d.delta > 0 ? "#7ee23e" : d.delta < 0 ? "#f43f5e" : "#94a3b8";
                return (
                  <li key={d.category} className="rounded-2xl border hairline bg-white p-4">
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-[11px] uppercase tracking-[0.12em] font-semibold" style={{ color: m.color }}>{d.category}</span>
                      <span className="text-xs text-forest-900/45">{m.short}</span>
                      <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold" style={{ color: tone }}>
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        {d.delta > 0 ? "+" : ""}{d.delta}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-10 text-forest-900/50 shrink-0">You</span>
                      <span className="flex-1 h-2 rounded-full bg-forest-900/[0.07] overflow-hidden">
                        <motion.span className="block h-full rounded-full" style={{ background: m.color }} initial={{ width: 0 }} animate={{ width: `${d.you}%` }} transition={{ duration: 0.8 }} />
                      </span>
                      <span className="w-8 text-right tabular-nums font-medium">{d.you}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1.5">
                      <span className="w-10 text-forest-900/50 shrink-0">Them</span>
                      <span className="flex-1 h-2 rounded-full bg-forest-900/[0.07] overflow-hidden">
                        <motion.span className="block h-full rounded-full bg-forest-900/25" initial={{ width: 0 }} animate={{ width: `${d.them}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                      </span>
                      <span className="w-8 text-right tabular-nums text-forest-900/55">{d.them}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Actionable gaps */}
            {res.gaps.length > 0 ? (
              <>
                <h2 className="font-display text-lg mb-1">What they do that you don&apos;t</h2>
                <p className="text-sm text-forest-900/55 mb-4">
                  {res.gaps.length} {res.gaps.length === 1 ? "check" : "checks"} they pass and you don&apos;t, highest value first.
                </p>
                <ol className="space-y-2 mb-8">
                  {res.gaps.map((g, i) => (
                    <li key={i} className="rounded-2xl border hairline bg-white p-5">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[10px] uppercase tracking-[0.12em] font-semibold px-1.5 py-0.5 rounded" style={{ color: AUDIT_CATEGORIES[g.category].color, background: `${AUDIT_CATEGORIES[g.category].color}1a` }}>
                          {g.category}
                        </span>
                        <span className="text-sm font-medium">{g.label}</span>
                        <span className="text-[11px] font-semibold text-lime-700 bg-lime-500/12 px-1.5 py-0.5 rounded">+{g.recoverable} pts</span>
                      </div>
                      {g.fix && (
                        <p className="text-sm text-forest-900/65 leading-relaxed flex items-start gap-2 mt-2">
                          <Wrench className="w-3.5 h-3.5 text-lime-600 shrink-0 mt-0.5" aria-hidden="true" />
                          {g.fix}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="rounded-2xl border hairline bg-white p-5 text-sm text-forest-900/60 mb-8">
                There&apos;s no check they pass that you don&apos;t. Any gap in score comes from checks you both fail — run
                the full audit to see those.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setRes(null); setA(""); setB(""); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border hairline bg-white text-sm hover:bg-forest-900/[0.03] transition-colors">
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Compare another pair
              </button>
              <Link href="/audit" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-900 text-canvas-50 text-sm font-medium hover:bg-forest-800 transition-colors">
                Full audit of your site <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SideCard({ label, data, winner }) {
  return (
    <div className={`rounded-4xl p-6 ${winner ? "bg-forest-900 text-canvas-50" : "border hairline bg-white"}`}>
      <div className={`text-[11px] uppercase tracking-[0.15em] mb-1 ${winner ? "text-lime-400" : "text-forest-900/35"}`}>
        {label}{winner && " · ahead"}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-display text-5xl leading-none">{data.overall}</span>
        <span className={winner ? "text-canvas-50/40" : "text-forest-900/35"}>/100</span>
        <span className={`ml-1 text-xs px-2 py-0.5 rounded ${winner ? "bg-canvas-50/15" : "bg-forest-900/[0.06]"}`}>{data.grade}</span>
      </div>
      <p className={`text-xs font-mono break-all leading-relaxed ${winner ? "text-canvas-50/45" : "text-forest-900/45"}`}>{data.url}</p>
    </div>
  );
}
