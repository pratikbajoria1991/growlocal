"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { AuditReport } from "@/components/AuditReport";
import { AUDIT_CATEGORIES } from "@/lib/brand";

const SAMPLES = ["zomato.com", "apollo247.com", "oyorooms.com"];

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const target = url.trim();
    if (!target) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Audit failed."); setLoading(false); return; }
      setResult(data);
      setLoading(false);
    } catch (err) {
      setError(err.message); setLoading(false);
    }
  }

  if (result) return <AuditReport result={result} onReset={() => { setResult(null); setUrl(""); }} />;

  return (
    <>
      <section className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/12 border border-lime-500/25 text-xs text-lime-600 font-medium mb-6"
          >
            <span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse" />
            Free · No signup · Results in seconds
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="font-display text-4xl sm:text-6xl leading-[1.02] tracking-tight mb-5"
          >
            Is your website visible to<br className="hidden sm:block" />
            <span className="text-lime-600"> Google, Maps, and AI?</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg text-forest-900/60 mb-9 max-w-2xl leading-relaxed"
          >
            Paste any URL. We fetch the page, parse the HTML, and score it across the three surfaces that decide whether customers find you — with the exact fix for every gap.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            onSubmit={submit} className="max-w-2xl"
          >
            <div className="flex items-stretch bg-white border hairline rounded-2xl shadow-lift overflow-hidden focus-within:border-lime-500/50 transition-colors">
              <div className="pl-4 flex items-center pointer-events-none">
                <Globe className="w-5 h-5 text-forest-900/25" />
              </div>
              <input
                type="text"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yourbusiness.com"
                disabled={loading}
                suppressHydrationWarning
                className="flex-1 px-3 py-4 sm:py-5 bg-transparent outline-none text-base sm:text-lg placeholder:text-forest-900/25 min-w-0"
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="m-1.5 px-4 sm:px-6 rounded-xl bg-forest-900 text-canvas-50 font-medium text-sm inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-forest-800 transition-colors shrink-0"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> <span className="hidden sm:inline">Auditing…</span></> : <>Audit <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 text-sm text-rose-500">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-forest-900/45">
              <span>Try:</span>
              {SAMPLES.map((s) => (
                <button key={s} type="button" onClick={() => setUrl(s)} className="px-2.5 py-1 rounded-full bg-forest-900/5 hover:bg-forest-900/10 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </motion.form>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(AUDIT_CATEGORIES).map(([k, m], i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
              className="rounded-4xl border hairline bg-white p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] uppercase tracking-[0.15em] font-semibold" style={{ color: m.color }}>{m.tag}</span>
                <span className="text-[10px] uppercase tracking-wider text-forest-900/30">100 pts</span>
              </div>
              <h3 className="font-display text-lg mb-2">{m.name}</h3>
              <p className="text-sm text-forest-900/60 leading-relaxed">{m.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
