"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, Trash2, ExternalLink, ClipboardCheck, AlertCircle, ChevronDown } from "lucide-react";
import { ACTION_TYPES, STATUS_LABELS, METRICS, CHECKPOINTS, dueCheckpoints, latestDelta } from "@/lib/ledger-types";

const PILL = {
  planned: "bg-forest-900/6 text-forest-900/60",
  awaiting_approval: "bg-amber-500/15 text-amber-700",
  approved: "bg-indigo-500/12 text-indigo-700",
  declined: "bg-rose-500/10 text-rose-600",
  done: "bg-emerald-500/15 text-emerald-700",
};

const today = () => new Date().toISOString().slice(0, 10);

// The operator's view of the action ledger for one client.
export function WorkLogPanel({ client }) {
  const [actions, setActions] = useState([]);
  const [adding, setAdding] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/concierge/actions?clientId=${encodeURIComponent(client.id)}`);
    const data = await res.json();
    if (res.ok) setActions(data.actions || []);
    else setError(data.error);
  }, [client.id]);

  useEffect(() => { setAdding(null); setError(null); load(); }, [load]);

  async function call(method, payload) {
    setBusy(true); setError(null);
    const res = await fetch("/api/concierge/actions", {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id, ...payload }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error); return null; }
    return data.action;
  }

  async function add(e) {
    e.preventDefault();
    const action = await call("POST", adding);
    if (!action) return;
    setActions((a) => [action, ...a]);
    setAdding(null);
  }

  async function patch(actionId, payload) {
    const action = await call("PATCH", { actionId, ...payload });
    if (action) setActions((all) => all.map((a) => (a.id === action.id ? action : a)));
    return Boolean(action);
  }

  async function remove(actionId) {
    if (!confirm("Delete this entry from the work log?")) return;
    await fetch(`/api/concierge/actions?clientId=${encodeURIComponent(client.id)}&actionId=${encodeURIComponent(actionId)}`, { method: "DELETE" });
    setActions((all) => all.filter((a) => a.id !== actionId));
  }

  const done = actions.filter((a) => a.status === "done").length;
  const awaiting = actions.filter((a) => a.status === "awaiting_approval").length;
  const due = actions.reduce((n, a) => n + dueCheckpoints(a).length, 0);
  const selectedType = adding ? ACTION_TYPES[adding.type] : null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 inline-flex items-center gap-1.5">
          <ClipboardCheck className="w-3.5 h-3.5" /> Work log
        </h3>
        <button
          onClick={() => setAdding(adding ? null : { type: "gbp_post", title: "", detail: "", plannedFor: today() })}
          className="text-xs inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Plan a change
        </button>
      </div>
      <p className="text-xs text-forest-900/65 mb-3">
        {done} done · {awaiting} waiting on owner · {due} follow-up{due === 1 ? "" : "s"} due
        {!client.ownerEmail && <span className="text-amber-600"> · no owner email, so they can&apos;t see or approve this yet</span>}
      </p>

      {error && (
        <div className="mb-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.05] p-3 flex items-start gap-2 text-xs text-rose-600">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {adding && (
        <form onSubmit={add} className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-4 mb-3 space-y-2.5">
          <div className="grid sm:grid-cols-[1fr_150px] gap-2.5">
            <select
              value={adding.type}
              onChange={(e) => setAdding({ ...adding, type: e.target.value })}
              className="px-3 py-2.5 rounded-xl border hairline bg-white text-sm outline-none focus:border-indigo-500/60"
            >
              {Object.entries(ACTION_TYPES).map(([id, t]) => (
                <option key={id} value={id}>{t.label}{t.risk === "approval" ? " — needs owner's OK" : ""}</option>
              ))}
            </select>
            <input
              type="date" value={adding.plannedFor}
              onChange={(e) => setAdding({ ...adding, plannedFor: e.target.value })}
              className="px-3 py-2.5 rounded-xl border hairline bg-white text-sm outline-none focus:border-indigo-500/60"
            />
          </div>
          <input
            value={adding.title} onChange={(e) => setAdding({ ...adding, title: e.target.value })}
            placeholder="What changes, in one line — this is what the owner reads"
            className="w-full px-3 py-2.5 rounded-xl border hairline bg-white text-sm outline-none focus:border-indigo-500/60"
          />
          <textarea
            rows={3} value={adding.detail} onChange={(e) => setAdding({ ...adding, detail: e.target.value })}
            placeholder="The exact change: the post text, the reply, the old vs new hours…"
            className="w-full px-3 py-2.5 rounded-xl border hairline bg-white text-sm leading-relaxed outline-none focus:border-indigo-500/60 resize-y"
          />
          {selectedType?.risk === "approval" && (
            <p className="text-xs text-amber-700">This will wait for the owner&apos;s approval before it can be marked done.</p>
          )}
          <div className="flex gap-2">
            <button disabled={busy} className="px-4 py-2 rounded-lg btn-premium text-white text-sm font-medium inline-flex items-center gap-2 disabled:opacity-40">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add to plan
            </button>
            <button type="button" onClick={() => setAdding(null)} className="px-4 py-2 rounded-lg border hairline bg-white text-sm">Cancel</button>
          </div>
        </form>
      )}

      {actions.length === 0 && !adding ? (
        <p className="text-sm text-forest-900/65">Nothing planned yet. Plan this week&apos;s changes above.</p>
      ) : (
        <ul className="space-y-1.5">
          {actions.map((a) => (
            <ActionRow key={a.id} action={a} busy={busy} onPatch={patch} onDelete={remove} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ActionRow({ action: a, busy, onPatch, onDelete }) {
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState(a.proofUrl || "");
  const [baseline, setBaseline] = useState(a.baseline || { periodDays: 28 });
  const [ownerReply, setOwnerReply] = useState("");
  const dueDays = dueCheckpoints(a);
  const [fuDay, setFuDay] = useState(dueDays[0] || CHECKPOINTS[0]);
  const [fu, setFu] = useState({ periodDays: a.baseline?.periodDays || 28 });
  const delta = latestDelta(a);
  const type = ACTION_TYPES[a.type] || ACTION_TYPES.other;

  const canShip = a.status === "planned" || a.status === "approved";

  return (
    <li className={`rounded-xl border bg-white ${dueDays.length ? "border-indigo-500/35" : "hairline"}`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left p-3.5 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{a.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${PILL[a.status]}`}>{STATUS_LABELS[a.status]}</span>
            {dueDays.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-indigo-500 text-white">Day {dueDays.join(", ")} numbers due</span>
            )}
          </div>
          <div className="text-xs text-forest-900/65 mt-0.5">
            {type.label} · {a.status === "done" ? `shipped ${a.doneAt.slice(0, 10)}` : `planned ${a.plannedFor}`}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-forest-900/65 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-3.5 pb-4 border-t hairline pt-3 space-y-4 text-sm">
          {a.detail && <p className="text-forest-900/70 whitespace-pre-wrap leading-relaxed">{a.detail}</p>}

          {a.approval && (
            <p className="text-xs text-forest-900/70">
              {a.approval.decision === "approved" ? "Approved" : "Declined"} by {a.approval.by} on {a.approval.at.slice(0, 10)}
              {a.approval.note ? ` — “${a.approval.note}”` : ""}
            </p>
          )}

          {/* Owner said yes/no outside the dashboard (usually WhatsApp) */}
          {a.status === "awaiting_approval" && (
            <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/25 p-3 space-y-2">
              <div className="text-xs text-amber-800">Owner replied on WhatsApp or email? Record it with their words as evidence.</div>
              <input
                value={ownerReply} onChange={(e) => setOwnerReply(e.target.value)}
                placeholder="e.g. 13 Sep, WhatsApp: “yes go ahead with Sunday closed”"
                className="w-full px-3 py-2 rounded-lg border hairline bg-white text-xs outline-none focus:border-indigo-500/60"
              />
              <div className="flex gap-2">
                <button disabled={busy || !ownerReply.trim()} onClick={() => onPatch(a.id, { recordApproval: { decision: "approved", note: ownerReply } })}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-40">Record approval</button>
                <button disabled={busy || !ownerReply.trim()} onClick={() => onPatch(a.id, { recordApproval: { decision: "declined", note: ownerReply } })}
                  className="px-3 py-1.5 rounded-lg border hairline bg-white text-xs disabled:opacity-40">Record decline</button>
              </div>
            </div>
          )}

          {/* Ship it — with a baseline taken first, or the result can never be measured */}
          {canShip && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-forest-900/60">Baseline — GBP Performance, the period before this change</div>
              <MetricInputs value={baseline} onChange={setBaseline} />
              <input
                value={proof} onChange={(e) => setProof(e.target.value)}
                placeholder="Proof link — the live post, review or page URL"
                className="w-full px-3 py-2 rounded-lg border hairline bg-white text-xs outline-none focus:border-indigo-500/60"
              />
              <button
                disabled={busy}
                onClick={() => onPatch(a.id, { status: "done", proofUrl: proof, baseline })}
                className="px-3 py-1.5 rounded-lg btn-premium text-white text-xs font-medium disabled:opacity-40"
              >
                Mark shipped
              </button>
            </div>
          )}

          {a.status === "done" && (
            <>
              {a.proofUrl && (
                <a href={a.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 inline-flex items-center gap-1">
                  View live <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {!a.baseline && <p className="text-xs text-amber-700">No baseline was recorded, so results for this change can&apos;t be compared.</p>}

              <DeltaTable delta={delta} />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-forest-900/60">
                  Record follow-up for day
                  <select value={fuDay} onChange={(e) => setFuDay(Number(e.target.value))}
                    className="px-2 py-1 rounded-md border hairline bg-white text-xs">
                    {CHECKPOINTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <MetricInputs value={fu} onChange={setFu} />
                <button
                  disabled={busy}
                  onClick={async () => { if (await onPatch(a.id, { followup: { day: fuDay, metrics: fu } })) setFu({ periodDays: fu.periodDays }); }}
                  className="px-3 py-1.5 rounded-lg border hairline bg-white text-xs font-medium disabled:opacity-40"
                >
                  Save day {fuDay} numbers
                </button>
              </div>
            </>
          )}

          <button onClick={() => onDelete(a.id)} className="text-xs text-rose-600 inline-flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Delete entry
          </button>
        </div>
      )}
    </li>
  );
}

function MetricInputs({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {METRICS.map(([k, label]) => (
        <label key={k} className="block">
          <span className="block text-[10px] text-forest-900/65 mb-1">{label}</span>
          <input
            type="number" min="0" inputMode="numeric" value={value[k] ?? ""}
            onChange={(e) => onChange({ ...value, [k]: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border hairline bg-white text-xs outline-none focus:border-indigo-500/60"
          />
        </label>
      ))}
      <label className="block">
        <span className="block text-[10px] text-forest-900/65 mb-1">Period (days)</span>
        <input
          type="number" min="1" value={value.periodDays ?? 28}
          onChange={(e) => onChange({ ...value, periodDays: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border hairline bg-white text-xs outline-none focus:border-indigo-500/60"
        />
      </label>
    </div>
  );
}

export function DeltaTable({ delta }) {
  if (!delta) return null;
  if (!delta.comparable) {
    return <p className="text-xs text-amber-700">Day {delta.day} numbers cover a different period than the baseline, so they aren&apos;t compared.</p>;
  }
  if (!delta.rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full min-w-[320px]">
        <thead>
          <tr className="text-left text-forest-900/65">
            <th className="py-1 font-medium">Day {delta.day} vs before ({delta.periodDays}-day periods)</th>
            <th className="py-1 font-medium text-right">Before</th>
            <th className="py-1 font-medium text-right">After</th>
            <th className="py-1 font-medium text-right">Change</th>
          </tr>
        </thead>
        <tbody>
          {delta.rows.map((r) => (
            <tr key={r.key} className="border-t hairline">
              <td className="py-1.5">{r.label}</td>
              <td className="py-1.5 text-right tabular-nums">{r.before}</td>
              <td className="py-1.5 text-right tabular-nums">{r.after}</td>
              <td className={`py-1.5 text-right tabular-nums ${r.diff > 0 ? "text-emerald-700" : r.diff < 0 ? "text-rose-600" : "text-forest-900/70"}`}>
                {r.diff > 0 ? "+" : ""}{r.diff}{r.pct != null ? ` (${r.pct > 0 ? "+" : ""}${r.pct}%)` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
