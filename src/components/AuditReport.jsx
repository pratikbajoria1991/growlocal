"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, Wrench,
  RotateCcw, Zap, TrendingUp, Info, Copy, Check, TrendingDown,
} from "lucide-react";
import { AUDIT_CATEGORIES, PLANS } from "@/lib/brand";

export function AuditReport({ result, onReset }) {
  const isGbp = result.mode === "gbp";
  // Text mode and GBP mode both produce exactly one category — same wide,
  // single-column ring layout, same room for a notAssessed disclosure card.
  const isSingleCategory = result.mode === "text" || isGbp;
  const cats = Object.entries(result.scores);

  const totalRecoverable = cats.reduce(
    (n, [, d]) => n + d.checks.filter((c) => !c.pass).reduce((m, c) => m + (c.max - c.points), 0),
    0
  );
  const totalPassing = cats.reduce((n, [, d]) => n + d.passing, 0);
  const totalFailing = cats.reduce((n, [, d]) => n + d.failing, 0);

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
      <button onClick={onReset} className="text-sm text-forest-900/70 hover:text-forest-900 mb-8 inline-flex items-center gap-1.5 transition-colors">
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Analyse another page
      </button>

      {isGbp && result.place && (
        <div className="mb-6">
          <h1 className="font-display text-2xl mb-1">{result.place.name}</h1>
          {result.place.address && <p className="text-sm text-forest-900/70">{result.place.address}</p>}
        </div>
      )}

      {/* Score header */}
      <div className="grid gap-6 mb-10 lg:grid-cols-[280px_1fr]">
        <OverallCard result={result} totalPassing={totalPassing} totalFailing={totalFailing} />
        <div className={`grid gap-3 ${isSingleCategory ? "" : "sm:grid-cols-3"}`}>
          {cats.map(([cat, data], i) => (
            <CategoryRing key={cat} cat={cat} data={data} delay={i * 0.1} wide={isSingleCategory} />
          ))}
          {isSingleCategory && result.notAssessed && (
            <div className="rounded-4xl border hairline bg-white p-5">
              <div className="flex items-start gap-2 mb-2.5">
                <Info className="w-4 h-4 text-forest-900/65 shrink-0 mt-0.5" aria-hidden="true" />
                <h3 className="font-medium text-sm">{isGbp ? "Not visible via the Places API" : "Not assessed in text mode"}</h3>
              </div>
              <ul className="space-y-1.5">
                {result.notAssessed.map((n) => (
                  <li key={n} className="text-xs text-forest-900/70 leading-relaxed">{n}</li>
                ))}
              </ul>
              <p className="text-xs text-forest-900/65 mt-3 leading-relaxed">
                {isGbp
                  ? "These need a human look inside Google Business Profile manager — the API doesn't expose them."
                  : "Run the same page by URL or paste its HTML to score all three surfaces."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Client-side rendering disclosure — without this, findings like "no
          title tag" read as false to anyone who views the page in a browser. */}
      {result.rendering?.clientRendered && (
        <div className="rounded-2xl bg-amber-500/[0.07] border border-amber-500/30 p-5 mb-10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="font-medium text-sm mb-1.5">This page renders in the browser, not on the server</h2>
              <p className="text-sm text-forest-900/70 leading-relaxed">{result.rendering.note}</p>
              {result.rendering.rendered && (
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-forest-900/70">
                  <span>Served HTML: <strong className="text-forest-900">{(result.rendering.servedHtmlChars / 1024).toFixed(0)} KB</strong>, {result.rendering.servedContentSignals} content elements</span>
                  <span>After JavaScript: <strong className="text-forest-900">{result.rendering.rendered.headings}</strong> headings, <strong className="text-forest-900">{result.rendering.rendered.paragraphs}</strong> paragraphs</span>
                </div>
              )}
              <p className="text-xs text-forest-900/70 mt-2.5 leading-relaxed">
                The scores below grade the served HTML — which is exactly what an AI answer engine receives.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Points recoverable banner */}
      {totalRecoverable > 0 && (
        <div className="rounded-2xl bg-indigo-500/[0.08] border border-indigo-500/25 p-4 mb-10 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-700 shrink-0" aria-hidden="true" />
          <p className="text-sm text-forest-900/80 leading-relaxed">
            <strong>{totalRecoverable} points</strong> are recoverable across {totalFailing} unfixed {totalFailing === 1 ? "check" : "checks"}.
            The five highest-impact ones are below.
          </p>
        </div>
      )}

      {/* Priority fixes */}
      {result.priorities?.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <h2 className="font-display text-xl">Start here — highest impact first</h2>
          </div>
          <ol className="space-y-2.5">
            {result.priorities.map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border hairline bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-700 flex items-center justify-center font-display text-sm shrink-0" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <CategoryTag cat={p.category} />
                      <span className="text-sm font-medium">{p.label}</span>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-500/12 px-1.5 py-0.5 rounded">
                        +{p.recoverable} pts
                      </span>
                    </div>
                    <p className="text-sm text-forest-900/65 leading-relaxed">{p.fix}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>
      )}

      {/* What you're losing — plain-language cost of each gap, GBP mode only */}
      {isGbp && result.whatYoureLosing?.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-rose-500" aria-hidden="true" />
            <h2 className="font-display text-xl">What this is costing you right now</h2>
          </div>
          <p className="text-sm text-forest-900/70 mb-6">
            Not points on a scorecard — customers who see your listing today and pick a competitor instead, for reasons
            you can fix.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {result.whatYoureLosing.map((c) => (
              <div key={c.id} className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-5">
                <div className="text-sm font-medium mb-1.5">{c.label}</div>
                <p className="text-sm text-forest-900/65 leading-relaxed">{c.losing}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What's working / what's missing */}
      <section className="mb-12">
        <h2 className="font-display text-xl mb-1">Full breakdown</h2>
        <p className="text-sm text-forest-900/70 mb-6">
          Every check we ran, split by what passed and what didn&apos;t, with the points each is worth.
        </p>

        <div className="grid lg:grid-cols-2 gap-5">
          <Column
            kind="missing"
            title="What's missing"
            subtitle={`${totalFailing} ${totalFailing === 1 ? "check" : "checks"} · ${totalRecoverable} pts available`}
            cats={cats}
            filter={(c) => !c.pass}
          />
          <Column
            kind="working"
            title="What's working"
            subtitle={`${totalPassing} ${totalPassing === 1 ? "check" : "checks"} passing`}
            cats={cats}
            filter={(c) => c.pass}
          />
        </div>
      </section>

      {/* Detected schema */}
      {result.schemaTypes?.length > 0 && (
        <div className="mb-12 p-5 rounded-2xl bg-forest-900/[0.03] border hairline">
          <h2 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-2.5">Structured data detected</h2>
          <div className="flex flex-wrap gap-1.5">
            {result.schemaTypes.map((t) => (
              <code key={t} className="text-xs px-2 py-1 rounded bg-white border hairline font-mono">{t}</code>
            ))}
          </div>
        </div>
      )}

      {result.stats && (
        <div className="mb-12 flex flex-wrap gap-x-8 gap-y-2 text-sm text-forest-900/70">
          <span><strong className="text-forest-900">{result.stats.words.toLocaleString()}</strong> words</span>
          <span><strong className="text-forest-900">{result.stats.paragraphs}</strong> paragraphs</span>
          <span><strong className="text-forest-900">{result.stats.sentences}</strong> sentences</span>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-4xl bg-forest-900 text-canvas-50 p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" style={{ background: "radial-gradient(ellipse 50% 60% at 90% 0%, rgba(126,226,62,0.35), transparent 70%)" }} />
        <div className="relative">
          <h2 className="font-display text-2xl sm:text-3xl mb-3">
            Don&apos;t want to fix {totalFailing === 1 ? "this" : "these"} yourself?
          </h2>
          <p className="text-canvas-50/70 mb-6 max-w-lg leading-relaxed">
            Growlocal Managed does the work behind the {totalFailing} gap{totalFailing === 1 ? "" : "s"} above — and keeps
            doing it every week — {PLANS.find((p) => p.id === "managed")?.price.toLowerCase()} per location a month.
            {isGbp ? " Profile updates, posts and review replies" : " Schema, FAQ content and profile updates"} are handled
            for you; anything risky waits for your OK. We won&apos;t promise a lead count — no one honestly can — but
            you&apos;ll see your Google numbers before and after.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/managed#apply" className="px-5 py-3 rounded-xl btn-premium text-white font-semibold text-sm transition-colors">
              Have Growlocal handle it
            </a>
            <a href="/proposal" className="px-5 py-3 rounded-xl border border-canvas-50/20 hover:bg-canvas-50/10 text-sm font-medium transition-colors">
              Compare me with competitors
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Counts from 0 to the score. Skipped entirely when the OS asks for reduced
// motion — a number that animates is a number that's harder to read.
function CountUp({ to, duration = 900 }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced) { setN(to); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo — fast start, gentle settle
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setN(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, reduced]);

  return <>{n}</>;
}

function CategoryTag({ cat }) {
  const m = AUDIT_CATEGORIES[cat];
  if (!m) return null;
  return (
    <span
      className="text-[10px] uppercase tracking-[0.12em] font-semibold px-1.5 py-0.5 rounded"
      style={{ color: m.color, background: `${m.color}1a` }}
    >
      {cat}
    </span>
  );
}

function gradeColor(g) {
  return { A: "#7ee23e", B: "#38bdf8", C: "#f59e0b", D: "#fb923c", F: "#f43f5e" }[g] || "#f43f5e";
}

function OverallCard({ result, totalPassing, totalFailing }) {
  const color = gradeColor(result.grade);
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="rounded-4xl bg-forest-900 text-canvas-50 p-7 relative overflow-hidden">
      <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden="true" style={{ background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${color}30, transparent 70%)` }} />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.15em] text-canvas-50/75 mb-1">
          {result.mode === "text" ? "Content score" : result.mode === "gbp" ? "Google Business Profile score" : "Overall visibility"}
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <motion.span
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="font-display text-7xl leading-none tabular-nums"
          >
            <CountUp to={result.overall} />
          </motion.span>
          <span className="text-canvas-50/75 text-lg">/100</span>
        </div>
        <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold mb-4" style={{ color, background: `${color}22` }}>
          Grade {result.grade}
        </div>

        <div className="flex items-center gap-4 text-xs mb-4">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {totalPassing} passing
          </span>
          <span className="inline-flex items-center gap-1.5 text-canvas-50/75">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> {totalFailing} to fix
          </span>
        </div>

        <button
          onClick={copyUrl}
          className="text-xs text-canvas-50/75 hover:text-canvas-50/80 break-all font-mono leading-relaxed text-left inline-flex items-start gap-1.5 transition-colors"
          title="Copy URL"
        >
          {copied ? <Check className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" /> : <Copy className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" />}
          {result.url}
        </button>

        {result.source && result.source !== "fetch" && (
          <p className="mt-2.5 text-[11px] text-canvas-50/75 leading-relaxed">
            {result.source === "proxy"
              ? "Fetched via reader proxy — the site blocked our direct request."
              : result.source === "text"
                ? "Scored from pasted text."
                : result.source === "gbp"
                  ? "Read live from Google's Places API, not your website."
                  : "Scored from pasted HTML."}
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryRing({ cat, data, delay, wide }) {
  const meta = AUDIT_CATEGORIES[cat];
  const color = meta?.color || "#7ee23e";
  const R = 42, C = 2 * Math.PI * R;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`rounded-4xl border hairline bg-white p-5 ${wide ? "flex items-center gap-5" : "flex flex-col items-center text-center"}`}
    >
      <div className="relative w-[110px] h-[110px] shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" role="img" aria-label={`${cat} score ${data.score} out of 100`}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(11,26,18,0.07)" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - (data.score / 100) * C }}
            transition={{ duration: 1.1, delay: delay + 0.12, ease: [0.34, 1.2, 0.64, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl leading-none">{data.score}</span>
          <span className="text-[10px] text-forest-900/65 mt-0.5">/100</span>
        </div>
      </div>

      <div className={wide ? "text-left" : ""}>
        <div className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-1" style={{ color }}>{meta?.tag || cat}</div>
        <div className="text-xs text-forest-900/70 leading-snug mb-2">{meta?.short || ""}</div>
        <div className="text-[11px] text-forest-900/65">
          {data.earned}/{data.max} pts · {data.passing} pass · {data.failing} fail
        </div>
      </div>
    </motion.div>
  );
}

function Column({ kind, title, subtitle, cats, filter }) {
  const missing = kind === "missing";
  const rows = cats.flatMap(([cat, data]) => data.checks.filter(filter).map((c) => ({ ...c, category: cat })));

  return (
    <section className="rounded-4xl border hairline bg-white overflow-hidden">
      <header className={`px-5 py-4 border-b hairline ${missing ? "bg-rose-500/[0.04]" : "bg-emerald-500/[0.05]"}`}>
        <h3 className="font-display text-lg inline-flex items-center gap-2">
          {missing
            ? <XCircle className="w-4 h-4 text-rose-500" aria-hidden="true" />
            : <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />}
          {title}
        </h3>
        <p className="text-xs text-forest-900/70 mt-0.5">{subtitle}</p>
      </header>

      {rows.length === 0 ? (
        <p className="p-5 text-sm text-forest-900/65 italic">
          {missing ? "Nothing missing — every check passed." : "No checks passing yet."}
        </p>
      ) : (
        <ul className="divide-y divide-forest-900/[0.06]">
          {rows.map((c) => (
            <CheckRow key={`${c.category}-${c.id}`} check={c} defaultOpen={false} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CheckRow({ check, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = check.pass ? CheckCircle2 : check.partial ? AlertTriangle : XCircle;
  const iconColor = check.pass ? "#7ee23e" : check.partial ? "#f59e0b" : "#f43f5e";
  const pct = check.max ? (check.points / check.max) * 100 : 0;

  return (
    <li>
      <button
        onClick={() => check.fix && setOpen((o) => !o)}
        className={`w-full flex items-start gap-3 p-4 text-left ${check.fix ? "hover:bg-forest-900/[0.02] cursor-pointer" : "cursor-default"}`}
        aria-expanded={check.fix ? open : undefined}
      >
        <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: iconColor }} aria-hidden="true" />
        <span className="flex-1 min-w-0">
          <span className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium leading-snug">{check.label}</span>
            <span className="text-[11px] text-forest-900/65 whitespace-nowrap tabular-nums shrink-0">
              {check.points}/{check.max}
            </span>
          </span>
          <span className="flex items-center gap-2 mt-1.5">
            <CategoryTag cat={check.category} />
            <span className="flex-1 h-1 rounded-full bg-forest-900/[0.07] overflow-hidden">
              <span
                className="block h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: iconColor }}
              />
            </span>
          </span>
        </span>
        {check.fix && <ChevronDown className={`w-4 h-4 text-forest-900/30 shrink-0 mt-0.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />}
      </button>

      <AnimatePresence initial={false}>
        {open && check.fix && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pl-11">
              <div className="rounded-lg bg-indigo-500/[0.07] border border-indigo-500/20 p-3.5">
                <div className="text-[10px] uppercase tracking-[0.12em] text-indigo-700 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Wrench className="w-3 h-3" aria-hidden="true" /> How to fix
                </div>
                <p className="text-sm text-forest-900/75 leading-relaxed">{check.fix}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
