"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, Play, Trash2, Copy, Check, Download, UserPlus, AlertCircle, Flame, X } from "lucide-react";

// Mirrors lib/prospects.js — kept in sync deliberately so the badge and the
// stored score never disagree.
function temp(score) {
  if (score >= 55) return { label: "Hot", cls: "bg-rose-500/12 text-rose-600 border-rose-500/25" };
  if (score >= 35) return { label: "Warm", cls: "bg-amber-500/12 text-amber-600 border-amber-500/30" };
  return { label: "Cold", cls: "bg-forest-900/5 text-forest-900/65 hairline" };
}

export function ProspectScanner() {
  const [raw, setRaw] = useState("");
  const [prospects, setProspects] = useState([]);
  const [progress, setProgress] = useState(null);
  const [failures, setFailures] = useState([]);
  const [error, setError] = useState(null);
  const [briefFor, setBriefFor] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/concierge/prospects");
    const d = await res.json();
    if (res.ok) setProspects(d.prospects || []);
    else setError(d.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Accepts "url", "Name, url" or "Name — url", one per line.
  function parseLines() {
    return raw
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(.*?)[,—–|\t]\s*(https?:\/\/\S+|\S+\.\S+)$/);
        if (m) return { name: m[1].trim(), url: m[2].trim() };
        return { name: "", url: line };
      })
      .filter((x) => /\./.test(x.url));
  }

  async function scan() {
    const items = parseLines();
    if (!items.length) return setError("Add at least one website, one per line.");
    setError(null); setFailures([]);

    for (let i = 0; i < items.length; i++) {
      setProgress({ done: i, total: items.length, current: items[i].url });
      try {
        const res = await fetch("/api/concierge/prospects", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items[i]),
        });
        const d = await res.json();
        if (d.error) setFailures((f) => [...f, { url: items[i].url, error: d.error }]);
      } catch (e) {
        setFailures((f) => [...f, { url: items[i].url, error: e.message }]);
      }
    }
    setProgress(null);
    setRaw("");
    await load();
  }

  async function remove(url) {
    await fetch(`/api/concierge/prospects?url=${encodeURIComponent(url)}`, { method: "DELETE" });
    await load();
  }

  async function promote(p) {
    const res = await fetch("/api/concierge/prospects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, promote: true }),
    });
    if (res.ok) alert(`Added "${p.name || p.url}" to your client book.`);
  }

  return (
    <div>
      {/* Input */}
      <div className="rounded-4xl border hairline bg-white p-6 mb-8">
        <label htmlFor="p-urls" className="block text-sm font-medium mb-2">Websites to scan</label>
        <textarea
          id="p-urls" rows={5} value={raw} onChange={(e) => setRaw(e.target.value)}
          placeholder={"Sharma Dental, sharmadental.com\nballygungeclinic.in\nRoyal Spa — royalspakolkata.com"}
          className="w-full px-4 py-3 rounded-xl border hairline bg-canvas-50 outline-none focus:border-indigo-500/60 text-sm leading-relaxed resize-y font-mono transition-colors"
        />
        <p className="text-xs text-forest-900/65 mt-2">
          One per line. <code className="text-[10px]">Name, url</code> or just the URL. Each takes ~3 seconds.
        </p>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={scan} disabled={Boolean(progress)}
            className="px-5 py-2.5 rounded-xl btn-premium text-white font-medium text-sm inline-flex items-center gap-2 disabled:opacity-40"
          >
            {progress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {progress ? `Scanning ${progress.done + 1}/${progress.total}…` : "Scan all"}
          </button>
          {prospects.length > 0 && !progress && (
            <button
              onClick={async () => { if (confirm("Clear all prospects?")) { await fetch("/api/concierge/prospects?url=__all__", { method: "DELETE" }); load(); } }}
              className="text-xs text-forest-900/65 hover:text-rose-600"
            >
              Clear all
            </button>
          )}
        </div>

        {progress && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-forest-900/8 overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <p className="text-xs text-forest-900/65 mt-1.5 truncate">{progress.current}</p>
          </div>
        )}

        {error && (
          <div className="mt-3 text-sm text-rose-600 inline-flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {failures.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
            <div className="text-xs font-medium mb-1.5">{failures.length} couldn&apos;t be scanned</div>
            <ul className="space-y-1">
              {failures.map((f) => (
                <li key={f.url} className="text-xs text-forest-900/60 leading-relaxed">
                  <span className="font-mono">{f.url}</span> — {f.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65">
          Prospects ({prospects.length}) — ranked by opportunity
        </h2>
      </div>

      {prospects.length === 0 ? (
        <p className="text-sm text-forest-900/65">
          Nothing scanned yet. Paste a list of local businesses above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-4xl border hairline bg-white">
          <table className="w-full text-sm">
            <thead className="bg-forest-900/[0.02] border-b hairline">
              <tr className="text-left">
                {["Business", "Opp.", "Overall", "SEO", "AEO", "GEO", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[11px] uppercase tracking-wider text-forest-900/65 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-900/[0.06]">
              {prospects.map((p) => {
                const t = temp(p.opportunity);
                return (
                  <tr key={p.url} className="hover:bg-forest-900/[0.015]">
                    <td className="px-4 py-3 min-w-0">
                      <div className="font-medium truncate max-w-[220px]">{p.name || p.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</div>
                      <div className="text-xs text-forest-900/65 truncate max-w-[220px]">{p.url}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${t.cls}`}>
                        {t.label === "Hot" && <Flame className="w-3 h-3" />}{p.opportunity}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">{p.overall}</td>
                    <td className="px-4 py-3 tabular-nums text-forest-900/60">{p.seo}</td>
                    <td className="px-4 py-3 tabular-nums text-forest-900/60">{p.aeo}</td>
                    <td className="px-4 py-3 tabular-nums text-forest-900/60">{p.geo}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setBriefFor(p)} title="Outreach brief" className="p-1.5 rounded-lg hover:bg-forest-900/5 text-forest-900/70 text-xs px-2">Brief</button>
                        <button onClick={() => promote(p)} title="Add as client" className="p-1.5 rounded-lg hover:bg-forest-900/5 text-forest-900/70">
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(p.url)} title="Remove" className="p-1.5 rounded-lg hover:bg-rose-500/5 text-forest-900/65 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {briefFor && <BriefModal prospect={briefFor} onClose={() => setBriefFor(null)} />}
    </div>
  );
}

function BriefModal({ prospect, onClose }) {
  const [brief, setBrief] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/concierge/prospects/brief?url=${encodeURIComponent(prospect.url)}`)
      .then((r) => r.json())
      .then((d) => setBrief(d.brief || "Could not build a brief."));
  }, [prospect.url]);

  async function copy() {
    try { await navigator.clipboard.writeText(brief); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* blocked */ }
  }

  function download() {
    const blob = new Blob([brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(prospect.name || prospect.url).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 bg-forest-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-4xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b hairline">
          <h3 className="font-display text-lg">Outreach brief</h3>
          <div className="flex items-center gap-1">
            <button onClick={copy} className="p-2 rounded-lg hover:bg-forest-900/5 text-forest-900/70">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={download} className="p-2 rounded-lg hover:bg-forest-900/5 text-forest-900/70"><Download className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-forest-900/5 text-forest-900/70"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <pre className="p-6 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap font-mono text-forest-900/75">{brief || "Building…"}</pre>
      </div>
    </div>
  );
}
