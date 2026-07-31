"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Code2, FileText, ArrowRight, AlertCircle, Loader2, Info } from "lucide-react";
import { AuditReport } from "@/components/AuditReport";
import { AUDIT_CATEGORIES } from "@/lib/brand";

const SAMPLES = ["zomato.com", "apollo247.com", "practo.com"];

const TABS = [
  { id: "url", label: "URL", icon: Globe, hint: "We fetch the live page and score all three surfaces." },
  { id: "html", label: "HTML", icon: Code2, hint: "Paste page source. Same full audit, no fetch needed — works behind any firewall." },
  { id: "text", label: "Text Content", icon: FileText, hint: "Paste plain copy. Scores content structure only — schema and meta tags aren't present in raw text." },
];

export default function AuditPage() {
  const [tab, setTab] = useState("url");
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [canPaste, setCanPaste] = useState(false);

  async function run(payload) {
    setLoading(true); setError(null); setCanPaste(false);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Audit failed.");
        setCanPaste(Boolean(data.canPasteHtml));
        setLoading(false);
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  function submit(e) {
    e.preventDefault();
    if (tab === "url" && url.trim()) run({ url: url.trim() });
    if (tab === "html" && html.trim().length >= 50) run({ html, url: url.trim() });
    if (tab === "text" && text.trim().length >= 120) run({ text, mode: "text" });
  }

  function reset() {
    setResult(null); setError(null); setCanPaste(false);
    setUrl(""); setHtml(""); setText("");
  }

  const canSubmit =
    (tab === "url" && url.trim().length > 3) ||
    (tab === "html" && html.trim().length >= 50) ||
    (tab === "text" && text.trim().length >= 120);

  if (result) return <AuditReport result={result} onReset={reset} />;

  const active = TABS.find((t) => t.id === tab);

  return (
    <>
      <section className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/12 border border-lime-500/25 text-xs text-lime-700 font-medium mb-6"
          >
            <span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse" aria-hidden="true" />
            Free · No signup · Results in seconds
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="font-display text-[2.5rem] sm:text-6xl leading-[1.03] tracking-[-0.035em] mb-5 text-balance"
          >
            Check your <span className="text-lime-600">visibility score</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg text-forest-900/65 mb-9 leading-relaxed text-pretty max-w-2xl"
          >
            See how well your page is optimised for Google, for AI answer engines like ChatGPT and Perplexity, and for
            local &ldquo;near me&rdquo; search — with the exact fix for every gap.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-4xl border hairline bg-white shadow-lift overflow-hidden"
          >
            {/* Tabs */}
            <div role="tablist" aria-label="Audit input type" className="grid grid-cols-3 border-b hairline">
              {TABS.map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => { setTab(t.id); setError(null); }}
                    className={`relative px-3 py-3.5 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                      on ? "text-forest-900" : "text-forest-900/45 hover:text-forest-900/70 hover:bg-forest-900/[0.02]"
                    }`}
                  >
                    <t.icon className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.id === "text" ? "Text" : t.label}</span>
                    {on && (
                      <motion.span
                        layoutId="tab-underline"
                        className="absolute left-0 right-0 -bottom-px h-0.5 bg-lime-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={submit} className="p-5 sm:p-6">
              {tab === "url" && (
                <>
                  <label htmlFor="a-url" className="sr-only">Page URL</label>
                  <input
                    id="a-url" type="text" inputMode="url" value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/your-page"
                    disabled={loading} suppressHydrationWarning
                    className="w-full px-4 py-3.5 rounded-xl border hairline bg-canvas-50 outline-none focus:border-lime-500/60 text-base transition-colors"
                  />
                  <p className="text-xs text-forest-900/45 mt-2">Enter the full URL of the page you want to analyse.</p>
                </>
              )}

              {tab === "html" && (
                <>
                  <label htmlFor="a-html" className="sr-only">Page HTML</label>
                  <textarea
                    id="a-html" rows={8} value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    placeholder={"<!DOCTYPE html>\n<html lang=\"en\">\n  <head>…"}
                    disabled={loading} suppressHydrationWarning
                    className="w-full px-4 py-3 rounded-xl border hairline bg-canvas-50 outline-none focus:border-lime-500/60 font-mono text-[11px] leading-relaxed resize-y transition-colors"
                  />
                  <p className="text-xs text-forest-900/45 mt-2">
                    Open your page, press <kbd className="px-1.5 py-0.5 rounded bg-forest-900/5 border hairline font-mono text-[10px]">Ctrl+U</kbd> for source,
                    select all and paste. Full three-surface audit, identical to the URL mode.
                  </p>
                </>
              )}

              {tab === "text" && (
                <>
                  <label htmlFor="a-text" className="sr-only">Page content</label>
                  <textarea
                    id="a-text" rows={8} value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your page copy here — headings and paragraphs as they appear to a reader."
                    disabled={loading} suppressHydrationWarning
                    className="w-full px-4 py-3 rounded-xl border hairline bg-canvas-50 outline-none focus:border-lime-500/60 text-sm leading-relaxed resize-y transition-colors"
                  />
                  <p className="text-xs text-forest-900/45 mt-2 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    Scores content structure only. Schema, meta tags and local signals aren&apos;t present in plain text, so we
                    don&apos;t pretend to grade them.
                  </p>
                </>
              )}

              <button
                type="submit" disabled={loading || !canSubmit}
                className="w-full mt-4 px-5 py-3.5 rounded-xl bg-forest-900 text-canvas-50 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-forest-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600 transition-colors"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Analysing…</> : <>Analyse my page <ArrowRight className="w-4 h-4" aria-hidden="true" /></>}
              </button>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.05] p-3.5">
                      <div className="flex items-start gap-2 text-sm text-rose-600">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="leading-relaxed">{error}</span>
                      </div>
                      {canPaste && (
                        <button
                          type="button"
                          onClick={() => { setTab("html"); setError(null); }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-forest-900 text-canvas-50 text-xs font-medium hover:bg-forest-800 transition-colors"
                        >
                          <Code2 className="w-3.5 h-3.5" aria-hidden="true" /> Switch to HTML mode
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {tab === "url" && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-forest-900/45">
                  <span>Try:</span>
                  {SAMPLES.map((s) => (
                    <button key={s} type="button" onClick={() => setUrl(s)} className="px-2.5 py-1 rounded-full bg-forest-900/5 hover:bg-forest-900/10 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </form>
          </motion.div>

          <p className="text-xs text-forest-900/40 mt-3 text-center">{active.hint}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-20">
        <h2 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-4 text-center">What we score</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(AUDIT_CATEGORIES).map(([k, m], i) => (
            <motion.article
              key={k}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07 }}
              className="rounded-4xl border hairline bg-white p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] uppercase tracking-[0.15em] font-semibold" style={{ color: m.color }}>{m.tag}</span>
                <span className="text-[10px] uppercase tracking-wider text-forest-900/30">100 pts</span>
              </div>
              <h3 className="font-display text-lg mb-2">{m.name}</h3>
              <p className="text-sm text-forest-900/60 leading-relaxed">{m.description}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </>
  );
}
