"use client";
// Growth Crew console: start runs, watch them progress stage by stage, and
// review exactly what each agent drafted, how it was checked, and what it
// measurably changed. Reads /api/concierge/crew (admin session).
import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Play, RefreshCw, CheckCircle2, AlertCircle, Clock, HelpCircle, XCircle, ChevronDown, Bot, Gauge, Coins, TrendingUp, Copy, Check,
} from "lucide-react";
import { tidyQuestions } from "@/lib/crew/questions";

const STAGES = ["discover", "specialists", "review", "revise", "prove", "done"];
const STAGE_LABEL = { discover: "Measure & plan", specialists: "Specialists drafting", review: "Fact-check", revise: "Revise flagged work", prove: "Prove & record", done: "Done" };
const AGENT_LABEL = { gbp: "Google profile", seo: "SEO", aeo: "AI answers (AEO)", geo: "Local (GEO)", planner: "Planner", reviewer: "Fact-checker" };
const STATUS = {
  approved: { label: "Approved", cls: "bg-emerald-600/10 text-emerald-800", icon: CheckCircle2 },
  needs_input: { label: "Needs owner input", cls: "bg-indigo-600/10 text-indigo-800", icon: HelpCircle },
  revise: { label: "Flagged", cls: "bg-amber-500/15 text-amber-800", icon: AlertCircle },
  held: { label: "Held for a human", cls: "bg-forest-900/[0.07] text-forest-900/80", icon: Clock },
  rejected: { label: "Rejected", cls: "bg-rose-600/10 text-rose-800", icon: XCircle },
  superseded: { label: "Superseded", cls: "bg-forest-900/[0.05] text-forest-900/65", icon: Clock },
};
const field = "w-full px-3.5 py-2.5 rounded-xl border hairline bg-canvas-50 outline-none focus:border-indigo-500/60 text-sm";
const fmtSec = (s) => (s == null ? "—" : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);
const fmtTok = (t) => (t == null ? "—" : t >= 1000 ? `${Math.round(t / 1000)}k` : String(t));
const when = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

async function api(path, opts) {
  const r = await fetch(path, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d;
}

export function CrewConsole() {
  const [info, setInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ input: "", website: "", goal: "", ownerFacts: "" });

  const load = useCallback(async () => {
    try {
      const [i, s, c] = await Promise.all([api("/api/concierge/crew"), api("/api/concierge/crew?stats=1"), api("/api/concierge/clients")]);
      setInfo(i); setStats(s); setClients(c.clients || []);
      setSelected((cur) => cur || i.runs?.[0]?.id || null);
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Load the selected run; poll while it runs.
  useEffect(() => {
    if (!selected) return;
    let alive = true, timer;
    const tick = async () => {
      try {
        const r = await api(`/api/concierge/crew?id=${encodeURIComponent(selected)}`);
        if (!alive) return;
        setRun(r);
        if (r.status === "running") timer = setTimeout(tick, 5000);
        else load();
      } catch (e) { if (alive) setError(e.message); }
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [selected, load]);

  async function start(body) {
    setBusy(true); setError(null);
    try {
      const r = await api("/api/concierge/crew", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setSelected(r.id);
      await load();
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  const active = clients.filter((c) => c.status === "active" && (c.crewGoal || "").trim().length >= 5);

  return (
    <div>
      {error && (
        <p role="alert" className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-4 text-sm text-rose-800 flex gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}

      {/* Status + stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <Tile icon={Bot} k="AI provider" v={info ? (info.llmConfigured ? `${info.provider} · ${info.model}` : "Not configured") : "…"} />
        <Tile icon={RefreshCw} k="Finished runs" v={stats?.runs ?? "…"} />
        <Tile icon={TrendingUp} k="Avg website audit gain" v={stats?.avgAuditDelta == null ? "—" : `${stats.avgAuditDelta >= 0 ? "+" : ""}${stats.avgAuditDelta} pts`} />
        <Tile icon={Gauge} k="Avg run time" v={fmtSec(stats?.avgSeconds)} />
        <Tile icon={Coins} k="Avg tokens / run" v={fmtTok(stats?.avgTokens)} />
      </div>

      {stats?.agents?.length > 0 && (
        <section className="rounded-3xl border hairline bg-white p-5 mb-8 overflow-x-auto">
          <h2 className="font-display text-xl mb-1">Agent quality</h2>
          <p className="text-sm text-forest-900/70 mb-4">Across the last {stats.runs} finished runs: how much of each specialist&apos;s work passed both the rule check and the fact-checker.</p>
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr className="text-left text-forest-900/65 text-xs">
              <th className="py-1.5 font-medium">Agent</th><th className="font-medium">Drafted</th><th className="font-medium">Approved</th><th className="font-medium">Needs owner</th><th className="font-medium">Flagged</th><th className="font-medium">Rejected / held</th><th className="font-medium">Approval rate</th>
            </tr></thead>
            <tbody>
              {stats.agents.map((a) => (
                <tr key={a.agent} className="border-t hairline">
                  <td className="py-2 font-medium">{AGENT_LABEL[a.agent] || a.agent}</td>
                  <td className="tabular-nums">{a.drafted}</td><td className="tabular-nums">{a.approved}</td><td className="tabular-nums">{a.needsInput}</td>
                  <td className="tabular-nums">{a.revise}</td><td className="tabular-nums">{a.rejected + a.held}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-forest-900/[0.08] overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: `${a.approvalRate || 0}%` }} /></div>
                      <span className="tabular-nums">{a.approvalRate ?? "—"}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Left: start + list */}
        <div className="space-y-6 min-w-0">
          <form
            onSubmit={(e) => { e.preventDefault(); start({ ...form, input: form.input.trim(), goal: form.goal.trim() }); }}
            className="rounded-3xl border hairline bg-white p-5 space-y-3"
          >
            <h2 className="font-display text-lg">Start a crew run</h2>
            <label className="block"><span className="block text-xs text-forest-900/70 mb-1.5">Business (Google Maps link, or name + area)</span>
              <input className={field} value={form.input} onChange={(e) => setForm({ ...form, input: e.target.value })} placeholder="Business name, neighbourhood, city" required /></label>
            <label className="block"><span className="block text-xs text-forest-900/70 mb-1.5">Website (optional)</span>
              <input className={field} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" /></label>
            <label className="block"><span className="block text-xs text-forest-900/70 mb-1.5">Goal</span>
              <input className={field} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="More enquiries from Google Maps this month" required /></label>
            <label className="block"><span className="block text-xs text-forest-900/70 mb-1.5">Verified owner facts (optional)</span>
              <textarea className={`${field} min-h-[72px]`} value={form.ownerFacts} onChange={(e) => setForm({ ...form, ownerFacts: e.target.value })} placeholder="Hours, doctors, services the owner confirmed" /></label>
            <button disabled={busy || !info?.llmConfigured || form.input.trim().length < 3 || form.goal.trim().length < 5} className="w-full min-h-[44px] rounded-xl btn-premium text-white text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-40">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run the crew
            </button>
            <p className="text-xs text-forest-900/65">Drafts only. Nothing is written to Google or the website.</p>
          </form>

          {active.length > 0 && (
            <div className="rounded-3xl border hairline bg-white p-5">
              <h2 className="font-display text-lg mb-1">Monthly clients</h2>
              <p className="text-xs text-forest-900/65 mb-3">Active clients with a goal. The daily cron runs each one every 28 days; start one now if needed.</p>
              <ul className="space-y-2">
                {active.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{c.name}</span>
                    <button type="button" disabled={busy} onClick={() => start({ clientRun: c.id })} className="min-h-[36px] px-3 rounded-lg border hairline text-xs hover:bg-forest-900/[0.04] shrink-0">Run now</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-3xl border hairline bg-white p-2">
            <div className="flex items-center justify-between px-3 py-2">
              <h2 className="font-display text-lg">Runs</h2>
              <button type="button" onClick={load} className="p-2 rounded-lg hover:bg-forest-900/[0.04]" aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <ul className="max-h-[520px] overflow-y-auto">
              {(info?.runs || []).map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setSelected(r.id)} className={`w-full text-left px-3 py-2.5 rounded-xl ${selected === r.id ? "bg-indigo-600/[0.07]" : "hover:bg-forest-900/[0.03]"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{r.business || "Starting…"}</span>
                      <span className={`text-[11px] rounded-full px-2 py-0.5 shrink-0 ${r.status === "done" ? "bg-emerald-600/10 text-emerald-800" : r.status === "failed" ? "bg-rose-600/10 text-rose-800" : "bg-amber-500/15 text-amber-800"}`}>{r.status}</span>
                    </div>
                    <div className="text-xs text-forest-900/65 mt-0.5 flex gap-2">
                      <span>{when(r.at)}</span>
                      {r.summary && <span>· {r.summary.approved} approved</span>}
                      {typeof r.delta === "number" && <span>· audit {r.delta >= 0 ? "+" : ""}{r.delta}</span>}
                    </div>
                  </button>
                </li>
              ))}
              {info && !info.runs?.length && <li className="px-3 py-4 text-sm text-forest-900/65">No runs yet.</li>}
            </ul>
          </div>
        </div>

        {/* Right: run detail */}
        <div className="min-w-0">{run ? <RunView run={run} /> : <div className="rounded-3xl border hairline bg-white p-8 text-sm text-forest-900/65">Select or start a run.</div>}</div>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, k, v }) {
  return (
    <div className="rounded-2xl border hairline bg-white p-4 min-w-0">
      <div className="text-xs text-forest-900/65 mb-1 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" aria-hidden="true" /> {k}</div>
      <div className="font-medium truncate" title={String(v)}>{v}</div>
    </div>
  );
}

export function RunView({ run }) {
  const s = run.summary || {};
  const idx = STAGES.indexOf(run.stage);
  const v = run.verification;
  const questions = tidyQuestions(s.ownerQuestions);
  const groups = ["approved", "needs_input", "revise", "held", "rejected", "superseded"].map((k) => [k, (run.items || []).filter((i) => i.status === k)]).filter(([, xs]) => xs.length);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-forest-900 text-canvas-50 p-6">
        <div className="text-sm text-canvas-50/75 mb-1">{when(run.createdAt)} · {run.provider} · {run.model}</div>
        <h2 className="font-display text-2xl sm:text-3xl mb-2">{run.business || "Measuring the business…"}</h2>
        <p className="text-canvas-50/80 mb-5">Goal: {run.goal}</p>
        <ol className="grid grid-cols-5 gap-1.5 mb-2" aria-label="Run progress">
          {STAGES.slice(0, 5).map((st, i) => (
            <li key={st} className="min-w-0">
              <div className={`h-1.5 rounded-full ${run.status === "failed" && i === idx ? "bg-rose-400" : i < idx || run.status === "done" ? "bg-emerald-400" : i === idx ? "bg-amber-300 animate-pulse" : "bg-canvas-50/15"}`} />
              <div className="text-[11px] text-canvas-50/70 mt-1 truncate">{STAGE_LABEL[st]}</div>
            </li>
          ))}
        </ol>
        {run.status === "failed" && <p className="text-sm text-rose-300 mt-2">Failed: {run.error}</p>}
        {run.websiteAuditError && <p className="text-sm text-amber-300 mt-2">Website audit failed ({run.websiteAuditError}); website issues are missing from this run.</p>}
        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 text-sm">
          <Stat k="Issues measured" v={s.issues ?? "—"} />
          <Stat k="Approved" v={s.approved ?? 0} />
          <Stat k="Needs owner" v={s.needsInput ?? 0} />
          <Stat k="Time" v={fmtSec(run.durationMs ? Math.round(run.durationMs / 1000) : null)} />
          <Stat k="Tokens" v={`${fmtTok(run.usage?.tokens)} / ${fmtTok(run.usage?.budget)}`} />
        </dl>
      </section>

      {v && (
        <section className="rounded-3xl border hairline bg-white p-5">
          <h3 className="font-display text-xl mb-1">Measured on the website</h3>
          <p className="text-sm text-forest-900/70 mb-4">Approved edits applied to a copy of the page, then Growlocal&apos;s real audit re-run.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {["overall", "SEO", "AEO", "GEO"].map((k) => (
              <div key={k} className="rounded-xl bg-canvas-100 p-3">
                <div className="text-xs text-forest-900/65">{k === "overall" ? "Overall" : k}</div>
                <div className="tabular-nums font-medium">{v.before[k]} → {v.after[k]} <span className={v.after[k] - v.before[k] > 0 ? "text-emerald-700" : v.after[k] - v.before[k] < 0 ? "text-rose-700" : "text-forest-900/60"}>({v.after[k] - v.before[k] >= 0 ? "+" : ""}{v.after[k] - v.before[k]})</span></div>
              </div>
            ))}
          </div>
          {v.perEdit?.length > 0 && (
            <ul className="text-sm space-y-1">
              {v.perEdit.map((e) => (
                <li key={e.id} className="flex justify-between gap-3"><span className="truncate">{e.edit}</span><span className="tabular-nums shrink-0">{e.rejected ? `rejected: ${e.rejected}` : `${e.delta >= 0 ? "+" : ""}${e.delta} on its own`}</span></li>
              ))}
            </ul>
          )}
        </section>
      )}

      {questions.length > 0 && (
        <section className="rounded-3xl border border-indigo-600/30 bg-indigo-600/[0.04] p-5">
          <h3 className="font-display text-xl mb-1">Questions for the owner</h3>
          <p className="text-sm text-forest-900/70 mb-3">Drafts waiting on these details. The owner can answer in their dashboard; the next run uses the answers.</p>
          <ul className="list-disc pl-5 text-sm space-y-1">{questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </section>
      )}

      {groups.map(([k, xs]) => (
        <section key={k}>
          <h3 className="font-display text-xl mb-3">{STATUS[k].label} <span className="text-forest-900/60 text-base">({xs.length})</span></h3>
          <ul className="space-y-2">{xs.map((it) => <ItemCard key={it.id} it={it} />)}</ul>
        </section>
      ))}

      {run.handoffs?.length > 0 && (
        <section className="rounded-3xl border hairline bg-white p-5">
          <h3 className="font-display text-xl mb-3">Handed to a person</h3>
          <ul className="space-y-2 text-sm">{run.handoffs.map((h) => <li key={h.issueId}><span className="font-medium">{h.title}</span><span className="text-forest-900/70"> — {h.next}</span></li>)}</ul>
        </section>
      )}

      {run.plan && (
        <details className="rounded-3xl border hairline bg-white p-5">
          <summary className="cursor-pointer font-display text-xl">Plan</summary>
          <p className="text-sm text-forest-900/75 mt-3 mb-3">{run.plan.summary}</p>
          <ul className="text-sm space-y-1.5">{run.plan.assignments.map((a) => <li key={a.agent}><span className="font-medium">{AGENT_LABEL[a.agent] || a.agent}:</span> {a.issue_ids.join(", ")}</li>)}</ul>
          {run.plan.skipped?.length > 0 && <ul className="text-sm space-y-1 mt-3 text-forest-900/70">{run.plan.skipped.map((x) => <li key={x.issue_id}>Skipped {x.issue_id}: {x.reason}</li>)}</ul>}
        </details>
      )}

      <details className="rounded-3xl border hairline bg-white p-5">
        <summary className="cursor-pointer font-display text-xl">Activity log ({run.trace?.length || 0})</summary>
        <ol className="mt-3 text-xs font-mono space-y-1 max-h-80 overflow-y-auto">
          {(run.trace || []).map((t, i) => (
            <li key={i} className={t.error ? "text-rose-700" : "text-forest-900/75"}>
              {t.at?.slice(11, 19)} {t.stage || t.agent} {t.type || ""} {t.tool || ""} {t.msg || t.error || ""}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function Stat({ k, v }) {
  return <div className="rounded-xl bg-canvas-50/10 p-2.5"><dt className="text-canvas-50/70 text-xs">{k}</dt><dd className="font-medium tabular-nums">{v}</dd></div>;
}

function ItemCard({ it }) {
  const [copied, setCopied] = useState(false);
  const st = STATUS[it.status] || STATUS.held;
  const Icon = st.icon;
  const problems = [...(it.checks?.deterministic?.problems || []), ...(it.checks?.reviewer?.problems || [])];
  return (
    <li className="rounded-2xl border hairline bg-white">
      <details className="group">
        <summary className="cursor-pointer list-none p-4 flex items-start gap-3">
          <span className={`text-[11px] rounded-full px-2 py-0.5 inline-flex items-center gap-1 shrink-0 ${st.cls}`}><Icon className="w-3 h-3" aria-hidden="true" /> {AGENT_LABEL[it.agent] || it.agent}</span>
          <span className="flex-1 min-w-0 text-sm font-medium">{it.title}</span>
          {typeof it.measuredDelta === "number" && <span className="text-xs tabular-nums text-forest-900/70 shrink-0">audit {it.measuredDelta >= 0 ? "+" : ""}{it.measuredDelta}</span>}
          <ChevronDown className="w-4 h-4 shrink-0 text-forest-900/50 group-open:rotate-180 transition-transform" aria-hidden="true" />
        </summary>
        <div className="px-4 pb-4 space-y-3 text-sm">
          <div className="relative">
            <pre className="whitespace-pre-wrap break-words rounded-xl bg-canvas-100 p-3 text-[13px] leading-relaxed max-h-72 overflow-y-auto">{it.content}</pre>
            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(it.content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border hairline" aria-label="Copy draft">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          {it.rationale && <p className="text-forest-900/75"><span className="font-medium">Why:</span> {it.rationale}</p>}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 ${it.checks?.deterministic?.problems?.length ? "bg-rose-600/10 text-rose-800" : "bg-emerald-600/10 text-emerald-800"}`}>Rule check: {it.checks?.deterministic?.problems?.length ? "failed" : "passed"}</span>
            <span className="rounded-full px-2 py-0.5 bg-forest-900/[0.06]">Fact-checker: {it.checks?.reviewer?.status || "no verdict"}</span>
            {it.checks?.jev && <span className="rounded-full px-2 py-0.5 bg-forest-900/[0.06]">Jev unsupported-claim score: {it.checks.jev.score}</span>}
            {it.ledgerStatus && <span className="rounded-full px-2 py-0.5 bg-indigo-600/10 text-indigo-800">Work log: {it.ledgerStatus.replace(/_/g, " ")}</span>}
          </div>
          {problems.length > 0 && <ul className="list-disc pl-5 text-rose-800">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
          {it.needsInput?.length > 0 && <p className="text-indigo-800"><span className="font-medium">Needs from owner:</span> {it.needsInput.join("; ")}</p>}
        </div>
      </details>
    </li>
  );
}
