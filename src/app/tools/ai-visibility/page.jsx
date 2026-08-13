"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ArrowRight, Loader2, AlertCircle, CheckCircle2, XCircle, Info, RotateCcw, ArrowLeft, ChevronDown } from "lucide-react";

export default function AiVisibilityTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError(null); setRes(null);
    try {
      const r = await fetch("/api/tools/ai-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error || "Check failed.");
      else setRes(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-12 pb-20">
      <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-forest-900/50 hover:text-forest-900 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All tools
      </Link>

      <div className="w-11 h-11 rounded-xl bg-lime-500/15 flex items-center justify-center mb-5">
        <Eye className="w-5 h-5 text-lime-600" aria-hidden="true" />
      </div>

      <h1 className="font-display text-3xl sm:text-4xl leading-[1.05] tracking-[-0.03em] mb-4 text-balance">
        Can AI crawlers see your site?
      </h1>
      <p className="text-forest-900/65 leading-relaxed mb-8 text-pretty">
        We read your robots.txt and check whether the crawlers behind ChatGPT, Claude, Perplexity and Google&apos;s AI
        Overviews are allowed through. If they&apos;re blocked, you cannot be cited — no amount of content or schema
        changes that.
      </p>

      <form onSubmit={submit} className="mb-8">
        <div className="flex items-stretch bg-white border hairline rounded-2xl shadow-lift overflow-hidden focus-within:border-lime-500/50 transition-colors">
          <input
            type="text" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="yourbusiness.com" disabled={loading} suppressHydrationWarning
            aria-label="Website URL"
            className="flex-1 px-4 py-3.5 bg-transparent outline-none min-w-0"
          />
          <button
            type="submit" disabled={loading || !url.trim()}
            className="m-1.5 px-5 rounded-xl bg-forest-900 text-canvas-50 font-medium text-sm inline-flex items-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-forest-800 transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <>Check <ArrowRight className="w-4 h-4" aria-hidden="true" /></>}
          </button>
        </div>
        {error && (
          <p className="mt-3 flex items-start gap-2 text-sm text-rose-600">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> {error}
          </p>
        )}
      </form>

      <AnimatePresence>
        {res && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-4xl bg-forest-900 text-canvas-50 p-7 mb-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden="true" style={{ background: `radial-gradient(ellipse 60% 70% at 85% 0%, ${res.blockedCount ? "rgba(244,63,94,0.3)" : "rgba(126,226,62,0.35)"}, transparent 70%)` }} />
              <div className="relative">
                <div className="text-[11px] uppercase tracking-[0.15em] text-canvas-50/45 mb-1">AI crawler access</div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-display text-6xl leading-none">{res.score}</span>
                  <span className="text-canvas-50/40">/100</span>
                </div>
                <p className="text-canvas-50/75 leading-relaxed">
                  {res.blockedCount === 0
                    ? `All ${res.allowedCount} major AI crawlers can reach ${res.origin}.`
                    : `${res.blockedCount} of ${res.crawlers.length} AI crawlers are blocked. Those engines cannot cite you.`}
                </p>
                <p className="text-xs text-canvas-50/45 mt-3 font-mono break-all">{res.robotsUrl}{res.robotsFound ? "" : " — not found"}</p>
              </div>
            </div>

            <h2 className="font-display text-lg mb-3">Crawler by crawler</h2>
            <ul className="space-y-2 mb-8">
              {res.crawlers.map((c) => (
                <li key={c.ua} className={`rounded-2xl border p-4 ${c.allowed ? "hairline bg-white" : "border-rose-500/25 bg-rose-500/[0.04]"}`}>
                  <div className="flex items-start gap-3">
                    {c.allowed
                      ? <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" aria-hidden="true" />
                      : <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <code className="text-sm font-semibold font-mono">{c.ua}</code>
                        <span className="text-xs text-forest-900/45">{c.owner}</span>
                      </div>
                      <p className="text-xs text-forest-900/55 mt-0.5">{c.purpose}</p>
                      <p className={`text-xs mt-1.5 ${c.allowed ? "text-forest-900/50" : "text-rose-600"}`}>{c.reason}</p>
                      {!c.allowed && (
                        <p className="text-xs text-forest-900/70 mt-2 leading-relaxed">
                          <strong>Fix:</strong> remove the rule blocking <code className="font-mono">{c.ua}</code> from robots.txt,
                          or add an explicit <code className="font-mono">User-agent: {c.ua}</code> group with <code className="font-mono">Allow: /</code>.
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {res.notes.length > 0 && (
              <>
                <h2 className="font-display text-lg mb-3">Other findings</h2>
                <ul className="space-y-2 mb-8">
                  {res.notes.map((n, i) => (
                    <li key={i} className="rounded-2xl border hairline bg-white p-4 flex items-start gap-3">
                      {n.kind === "good"
                        ? <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" aria-hidden="true" />
                        : <Info className="w-4 h-4 text-forest-900/35 shrink-0 mt-0.5" aria-hidden="true" />}
                      <div>
                        <p className="text-sm text-forest-900/80 leading-relaxed">{n.text}</p>
                        {n.fix && <p className="text-xs text-forest-900/60 mt-1.5 leading-relaxed">{n.fix}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {res.robotsPreview && (
              <details className="rounded-2xl border hairline bg-white overflow-hidden mb-8 group">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium flex items-center justify-between">
                  Your robots.txt
                  <ChevronDown className="w-4 h-4 text-forest-900/35 group-open:rotate-180 transition-transform" aria-hidden="true" />
                </summary>
                <pre className="px-4 pb-4 text-[11px] font-mono leading-relaxed overflow-auto max-h-72 text-forest-900/70 whitespace-pre-wrap">{res.robotsPreview}</pre>
              </details>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setRes(null); setUrl(""); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border hairline bg-white text-sm hover:bg-forest-900/[0.03] transition-colors">
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Check another
              </button>
              <Link href="/audit" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-900 text-canvas-50 text-sm font-medium hover:bg-forest-800 transition-colors">
                Run the full audit <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
