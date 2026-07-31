"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, Wrench, RotateCcw, Zap } from "lucide-react";
import { AUDIT_CATEGORIES } from "@/lib/brand";

export function AuditReport({ result, onReset }) {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
      <button onClick={onReset} className="text-sm text-forest-900/50 hover:text-forest-900 mb-8 inline-flex items-center gap-1.5">
        <RotateCcw className="w-3.5 h-3.5" /> Audit another site
      </button>

      {/* Header: overall + three category rings */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-12">
        <OverallCard result={result} />
        <div className="grid sm:grid-cols-3 gap-3">
          {Object.entries(result.scores).map(([cat, data], i) => (
            <CategoryRing key={cat} cat={cat} data={data} delay={i * 0.12} />
          ))}
        </div>
      </div>

      {/* Priority fixes */}
      {result.priorities.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-lime-600" />
            <h2 className="font-display text-xl">Start here — your 5 highest-impact fixes</h2>
          </div>
          <div className="space-y-2.5">
            {result.priorities.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border hairline bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-lg bg-lime-500/15 text-lime-600 flex items-center justify-center font-display text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className="text-[10px] uppercase tracking-[0.12em] font-semibold px-1.5 py-0.5 rounded"
                        style={{ color: AUDIT_CATEGORIES[p.category].color, background: `${AUDIT_CATEGORIES[p.category].color}1a` }}
                      >
                        {p.category}
                      </span>
                      <span className="text-sm font-medium">{p.label}</span>
                      <span className="text-[11px] text-forest-900/40">+{p.recoverable} pts available</span>
                    </div>
                    <p className="text-sm text-forest-900/65 leading-relaxed">{p.fix}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Full breakdown */}
      <div className="space-y-10">
        {Object.entries(result.scores).map(([cat, data]) => (
          <CategoryBreakdown key={cat} cat={cat} data={data} />
        ))}
      </div>

      {/* Detected schema */}
      {result.schemaTypes.length > 0 && (
        <div className="mt-12 p-5 rounded-2xl bg-forest-900/[0.03] border hairline">
          <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/40 mb-2">Structured data detected</div>
          <div className="flex flex-wrap gap-1.5">
            {result.schemaTypes.map((t) => (
              <code key={t} className="text-xs px-2 py-1 rounded bg-white border hairline font-mono">{t}</code>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-4xl bg-forest-900 text-canvas-50 p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 60% at 90% 0%, rgba(126,226,62,0.35), transparent 70%)" }} />
        <div className="relative">
          <h2 className="font-display text-2xl sm:text-3xl mb-3">Want these fixed without doing it yourself?</h2>
          <p className="text-canvas-50/70 mb-6 max-w-lg leading-relaxed">
            Growlocal Autopilot connects to your Google Business Profile and runs an AI agent that drafts posts, replies to reviews, generates your FAQ schema and ships a monthly report.
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

function gradeColor(g) {
  return { A: "#7ee23e", B: "#38bdf8", C: "#f59e0b", D: "#fb923c", F: "#f43f5e" }[g] || "#f43f5e";
}

function OverallCard({ result }) {
  const color = gradeColor(result.grade);
  return (
    <div className="rounded-4xl bg-forest-900 text-canvas-50 p-7 relative overflow-hidden">
      <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${color}30, transparent 70%)` }} />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.15em] text-canvas-50/45 mb-1">Overall visibility</div>
        <div className="flex items-baseline gap-2 mb-3">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
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
        <div className="text-xs text-canvas-50/50 break-all font-mono leading-relaxed">{result.url}</div>
        {result.source && result.source !== "fetch" && (
          <div className="mt-2.5 text-[11px] text-canvas-50/40 leading-relaxed">
            {result.source === "proxy"
              ? "Fetched via reader proxy — the site blocked our direct request."
              : "Scored from HTML you pasted."}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryRing({ cat, data, delay }) {
  const meta = AUDIT_CATEGORIES[cat];
  const R = 42, C = 2 * Math.PI * R;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-4xl border hairline bg-white p-5 flex flex-col items-center text-center"
    >
      <div className="relative w-[110px] h-[110px] mb-3">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(11,26,18,0.07)" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r={R} fill="none" stroke={meta.color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - (data.score / 100) * C }}
            transition={{ duration: 1.2, delay: delay + 0.15, ease: [0.34, 1.2, 0.64, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-3xl leading-none">{data.score}</div>
          <div className="text-[10px] text-forest-900/40 mt-0.5">/100</div>
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-1" style={{ color: meta.color }}>{meta.tag}</div>
      <div className="text-xs text-forest-900/55 leading-snug mb-2">{meta.short}</div>
      <div className="text-[11px] text-forest-900/45">
        {data.passing} passing · {data.failing} to fix
      </div>
    </motion.div>
  );
}

function CategoryBreakdown({ cat, data }) {
  const meta = AUDIT_CATEGORIES[cat];
  const [showPassing, setShowPassing] = useState(false);
  const failing = data.checks.filter((x) => !x.pass);
  const passing = data.checks.filter((x) => x.pass);

  return (
    <section>
      <div className="mb-4">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-[11px] uppercase tracking-[0.15em] font-semibold" style={{ color: meta.color }}>{meta.tag}</span>
          <h2 className="font-display text-xl">{meta.name}</h2>
          <span className="ml-auto text-sm text-forest-900/45">{data.earned}/{data.max} pts</span>
        </div>
        <p className="text-sm text-forest-900/55 mt-1.5 leading-relaxed max-w-2xl">{meta.description}</p>
      </div>

      <div className="space-y-2">
        {failing.map((c) => <CheckRow key={c.id} check={c} defaultOpen />)}
      </div>

      {passing.length > 0 && (
        <>
          <button
            onClick={() => setShowPassing((s) => !s)}
            className="mt-3 text-xs text-forest-900/45 hover:text-forest-900 inline-flex items-center gap-1.5"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPassing ? "rotate-180" : ""}`} />
            {showPassing ? "Hide" : "Show"} {passing.length} passing check{passing.length === 1 ? "" : "s"}
          </button>
          <AnimatePresence initial={false}>
            {showPassing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-2.5">
                  {passing.map((c) => <CheckRow key={c.id} check={c} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </section>
  );
}

function CheckRow({ check, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = check.pass ? CheckCircle2 : check.partial ? AlertTriangle : XCircle;
  const iconColor = check.pass ? "#7ee23e" : check.partial ? "#f59e0b" : "#f43f5e";

  return (
    <div className="rounded-xl border hairline bg-white overflow-hidden">
      <button
        onClick={() => check.fix && setOpen((o) => !o)}
        className={`w-full flex items-start gap-3 p-4 text-left ${check.fix ? "cursor-pointer hover:bg-forest-900/[0.02]" : "cursor-default"}`}
      >
        <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: iconColor }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-snug">{check.label}</div>
          <div className="text-[11px] text-forest-900/40 mt-0.5">{check.points}/{check.max} points</div>
        </div>
        {check.fix && <ChevronDown className={`w-4 h-4 text-forest-900/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      <AnimatePresence initial={false}>
        {open && check.fix && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pl-11">
              <div className="rounded-lg bg-lime-500/[0.07] border border-lime-500/20 p-3.5">
                <div className="text-[10px] uppercase tracking-[0.12em] text-lime-600 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Wrench className="w-3 h-3" /> How to fix
                </div>
                <p className="text-sm text-forest-900/75 leading-relaxed">{check.fix}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
