"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, Wrench,
  RotateCcw, Zap, TrendingUp, Info, Copy, Check,
} from "lucide-react";
import { AUDIT_CATEGORIES } from "@/lib/brand";

export function AuditReport({ result, onReset }) {
  const isText = result.mode === "text";
  const cats = Object.entries(result.scores);

  const totalRecoverable = cats.reduce(
    (n, [, d]) => n + d.checks.filter((c) => !c.pass).reduce((m, c) => m + (c.max - c.points), 0),
    0
  );
  const totalPassing = cats.reduce((n, [, d]) => n + d.passing, 0);
  const totalFailing = cats.reduce((n, [, d]) => n + d.failing, 0);

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
      <button onClick={onReset} className="text-sm text-forest-900/50 hover:text-forest-900 mb-8 inline-flex items-center gap-1.5 transition-colors">
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Analyse another page
      </button>

      {/* Score header */}
      <div className={`grid gap-6 mb-10 ${isText ? "lg:grid-cols-[280px_1fr]" : "lg:grid-cols-[280px_1fr]"}`}>
        <OverallCard result={result} totalPassing={totalPassing} totalFailing={totalFailing} />
        <div className={`grid gap-3 ${isText ? "" : "sm:grid-cols-3"}`}>
          {cats.map(([cat, data], i) => (
            <CategoryRing key={cat} cat={cat} data={data} delay={i * 0.1} wide={isText} />
          ))}
          {isText && result.notAssessed && (
            <div className="rounded-4xl border hairline bg-white p-5">
              <div className="flex items-start gap-2 mb-2.5">
                <Info className="w-4 h-4 text-forest-900/35 shrink-0 mt-0.5" aria-hidden="true" />
                <h3 className="font-medium text-sm">Not assessed in text mode</h3>
              </div>
              <ul className="space-y-1.5">
                {result.notAssessed.map((n) => (
                  <li key={n} className="text-xs text-forest-900/55 leading-relaxed">{n}</li>
                ))}
              </ul>
              <p className="text-xs text-forest-900/45 mt-3 leading-relaxed">
                Run the same page by URL or paste its HTML to score all three surfaces.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Points recoverable banner */}
      {totalRecoverable > 0 && (
        <div className="rounded-2xl bg-lime-500/[0.08] border border-lime-500/25 p-4 mb-10 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-lime-700 shrink-0" aria-hidden="true" />
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
            <Zap className="w-4 h-4 text-lime-600" aria-hidden="true" />
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
                  <span className="w-7 h-7 rounded-lg bg-lime-500/15 text-lime-700 flex items-center justify-center font-display text-sm shrink-0" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <CategoryTag cat={p.category} />
                      <span className="text-sm font-medium">{p.label}</span>
                      <span className="text-[11px] font-semibold text-lime-700 bg-lime-500/12 px-1.5 py-0.5 rounded">
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

      {/* What's working / what's missing */}
      <section className="mb-12">
        <h2 className="font-display text-xl mb-1">Full breakdown</h2>
        <p className="text-sm text-forest-900/55 mb-6">
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
          <h2 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/40 mb-2.5">Structured data detected</h2>
          <div className="flex flex-wrap gap-1.5">
            {result.schemaTypes.map((t) => (
              <code key={t} className="text-xs px-2 py-1 rounded bg-white border hairline font-mono">{t}</code>
            ))}
          </div>
        </div>
      )}

      {result.stats && (
        <div className="mb-12 flex flex-wrap gap-x-8 gap-y-2 text-sm text-forest-900/55">
          <span><strong className="text-forest-900">{result.stats.words.toLocaleString()}</strong> words</span>
          <span><strong className="text-forest-900">{result.stats.paragraphs}</strong> paragraphs</span>
          <span><strong className="text-forest-900">{result.stats.sentences}</strong> sentences</span>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-4xl bg-forest-900 text-canvas-50 p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" style={{ background: "radial-gradient(ellipse 50% 60% at 90% 0%, rgba(126,226,62,0.35), transparent 70%)" }} />
        <div className="relative">
          <h2 className="font-display text-2xl sm:text-3xl mb-3">Want these handled for you?</h2>
          <p className="text-canvas-50/70 mb-6 max-w-lg leading-relaxed">
            GBP Autopilot connects to your Google Business Profile and runs an AI agent that drafts your posts, review
            replies and FAQ schema — the same fixes this report is asking for.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/autopilot" className="px-5 py-3 rounded-xl bg-lime-500 text-forest-900 font-semibold text-sm hover:bg-lime-400 transition-colors">
              See GBP Autopilot
            </a>
            <a href="/pricing" className="px-5 py-3 rounded-xl border border-canvas-50/20 hover:bg-canvas-50/10 text-sm font-medium transition-colors">
              View pricing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
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
        <div className="text-[11px] uppercase tracking-[0.15em] text-canvas-50/45 mb-1">
          {result.mode === "text" ? "Content score" : "Overall visibility"}
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <motion.span
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="font-display text-7xl leading-none"
          >
            {result.overall}
          </motion.span>
          <span className="text-canvas-50/40 text-lg">/100</span>
        </div>
        <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold mb-4" style={{ color, background: `${color}22` }}>
          Grade {result.grade}
        </div>

        <div className="flex items-center gap-4 text-xs mb-4">
          <span className="inline-flex items-center gap-1.5 text-lime-400">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {totalPassing} passing
          </span>
          <span className="inline-flex items-center gap-1.5 text-canvas-50/50">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> {totalFailing} to fix
          </span>
        </div>

        <button
          onClick={copyUrl}
          className="text-xs text-canvas-50/50 hover:text-canvas-50/80 break-all font-mono leading-relaxed text-left inline-flex items-start gap-1.5 transition-colors"
          title="Copy URL"
        >
          {copied ? <Check className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" /> : <Copy className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" />}
          {result.url}
        </button>

        {result.source && result.source !== "fetch" && (
          <p className="mt-2.5 text-[11px] text-canvas-50/40 leading-relaxed">
            {result.source === "proxy"
              ? "Fetched via reader proxy — the site blocked our direct request."
              : result.source === "text"
                ? "Scored from pasted text."
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
          <span className="text-[10px] text-forest-900/40 mt-0.5">/100</span>
        </div>
      </div>

      <div className={wide ? "text-left" : ""}>
        <div className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-1" style={{ color }}>{meta?.tag || cat}</div>
        <div className="text-xs text-forest-900/55 leading-snug mb-2">{meta?.short || ""}</div>
        <div className="text-[11px] text-forest-900/45">
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
      <header className={`px-5 py-4 border-b hairline ${missing ? "bg-rose-500/[0.04]" : "bg-lime-500/[0.05]"}`}>
        <h3 className="font-display text-lg inline-flex items-center gap-2">
          {missing
            ? <XCircle className="w-4 h-4 text-rose-500" aria-hidden="true" />
            : <CheckCircle2 className="w-4 h-4 text-lime-600" aria-hidden="true" />}
          {title}
        </h3>
        <p className="text-xs text-forest-900/50 mt-0.5">{subtitle}</p>
      </header>

      {rows.length === 0 ? (
        <p className="p-5 text-sm text-forest-900/45 italic">
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
            <span className="text-[11px] text-forest-900/45 whitespace-nowrap tabular-nums shrink-0">
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
              <div className="rounded-lg bg-lime-500/[0.07] border border-lime-500/20 p-3.5">
                <div className="text-[10px] uppercase tracking-[0.12em] text-lime-700 font-semibold mb-1.5 flex items-center gap-1.5">
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
