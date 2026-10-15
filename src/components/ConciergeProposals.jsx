"use client";
import { useState, useEffect, useCallback } from "react";
import { Copy, Check, ExternalLink, ListPlus, Loader2 } from "lucide-react";
import { ProposalForm } from "./ProposalForm";

export function ConciergeProposals() {
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([fetch("/api/proposals"), fetch("/api/concierge/clients")]);
    const pd = await p.json();
    const cd = await c.json();
    if (p.ok) setProposals(pd.proposals || []); else setError(pd.error);
    if (c.ok) setClients(cd.clients || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="rounded-4xl border hairline bg-white p-5 mb-8">
        <ProposalForm compact onCreated={() => load()} />
      </div>
      {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}
      {proposals.length === 0 ? (
        <p className="text-sm text-forest-900/65">No proposals yet.</p>
      ) : (
        <ul className="space-y-3">
          {proposals.map((p) => <ProposalRow key={p.id} p={p} clients={clients} />)}
        </ul>
      )}
    </>
  );
}

function ProposalRow({ p, clients }) {
  const [copied, setCopied] = useState(false);
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(p.outbound);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked */ }
  }

  async function loadPlan() {
    if (!clientId) return;
    setLoading(true); setResult(null);
    const res = await fetch("/api/concierge/proposals/plan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId: p.id, clientId }),
    });
    const data = await res.json();
    setLoading(false);
    setResult(res.ok ? `Added ${data.created} changes to the work log.` : data.error);
  }

  return (
    <li className="rounded-2xl border hairline bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-medium">{p.name}</div>
          <div className="text-xs text-forest-900/65">
            {p.address || "—"} · {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </div>
        </div>
        <div className="text-xs text-forest-900/60 shrink-0">
          {p.total} issues · we fix {p.fixable} · <strong>{p.tier}</strong>
        </div>
      </div>
      <pre className="text-xs whitespace-pre-wrap font-sans text-forest-900/70 bg-canvas-50 rounded-xl p-3 mb-3 leading-relaxed">{p.outbound}</pre>
      <div className="flex flex-wrap items-center gap-2">
        <a href={`/p/${p.id}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-2 rounded-lg border hairline inline-flex items-center gap-1.5 hover:bg-forest-900/[0.03]">
          Open <ExternalLink className="w-3 h-3" />
        </a>
        <button onClick={copy} className="text-xs px-3 py-2 rounded-lg border hairline inline-flex items-center gap-1.5 hover:bg-forest-900/[0.03]">
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />} Copy message
        </button>
        <span className="flex-1" />
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="text-xs px-2.5 py-2 rounded-lg border hairline bg-white">
          <option value="">Signed? Pick the client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={loadPlan} disabled={!clientId || loading} className="text-xs px-3 py-2 rounded-lg btn-premium text-white inline-flex items-center gap-1.5 disabled:opacity-40">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListPlus className="w-3 h-3" />} Load plan into work log
        </button>
      </div>
      {result && <p className="text-xs text-forest-900/60 mt-2">{result}</p>}
    </li>
  );
}
