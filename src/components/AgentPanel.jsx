"use client";
import { useState } from "react";
import { FileText, MessageSquare, HelpCircle, BarChart3, Loader2, CheckCircle2, XCircle, ArrowRight, Copy, Check } from "lucide-react";

const ICONS = { posts: FileText, replies: MessageSquare, faq: HelpCircle, report: BarChart3 };

export function AgentPanel({ actions, connected }) {
  const [state, setState] = useState({});

  async function run(id) {
    if (!connected) return;
    setState((s) => ({ ...s, [id]: { status: "running" } }));
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: id }),
      });
      const data = await res.json();
      if (!res.ok) return setState((s) => ({ ...s, [id]: { status: "error", error: data.error } }));
      setState((s) => ({ ...s, [id]: { status: "done", ...data } }));
    } catch (e) {
      setState((s) => ({ ...s, [id]: { status: "error", error: e.message } }));
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {actions.map((a) => {
        const s = state[a.id] || { status: "idle" };
        const Icon = ICONS[a.id];
        return (
          <div key={a.id} className="rounded-2xl border hairline bg-white p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-lime-500/12 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-lime-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm">{a.label}</div>
                <div className="text-xs text-forest-900/45 mt-0.5">{a.hint}</div>
              </div>
            </div>

            {s.status === "idle" && (
              <button
                onClick={() => run(a.id)}
                disabled={!connected}
                className="w-full px-3 py-2.5 rounded-xl bg-forest-900 text-canvas-50 text-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-forest-800 transition-colors"
              >
                Run <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {s.status === "running" && (
              <div className="w-full px-3 py-2.5 rounded-xl bg-forest-900/8 text-forest-900/50 text-sm inline-flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…
              </div>
            )}

            {s.status === "error" && (
              <div>
                <div className="text-sm text-rose-500 inline-flex items-center gap-1.5 mb-2">
                  <XCircle className="w-4 h-4" /> {s.error}
                </div>
                <button onClick={() => run(a.id)} className="text-xs text-lime-600 hover:underline">Retry</button>
              </div>
            )}

            {s.status === "done" && <Result data={s} onRerun={() => run(a.id)} />}
          </div>
        );
      })}
      {!connected && (
        <p className="sm:col-span-2 text-xs text-forest-900/40 italic">
          Connect your Google Business Profile above to enable these actions.
        </p>
      )}
    </div>
  );
}

function Result({ data, onRerun }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(data.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm text-lime-600 font-medium mb-2">
        <CheckCircle2 className="w-4 h-4" />
        {data.words} words
        <span className="text-forest-900/35 font-normal text-xs">
          · {data.source === "stub" ? "stub mode" : `${(data.ms / 1000).toFixed(1)}s`}
        </span>
      </div>
      <div className="flex gap-2 mb-2">
        <button onClick={() => setOpen((o) => !o)} className="text-xs px-2.5 py-1.5 rounded-lg bg-forest-900/5 hover:bg-forest-900/10 transition-colors">
          {open ? "Hide" : "View"} draft
        </button>
        <button onClick={copy} className="text-xs px-2.5 py-1.5 rounded-lg bg-forest-900/5 hover:bg-forest-900/10 inline-flex items-center gap-1 transition-colors">
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
        <button onClick={onRerun} className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-forest-900/5 text-forest-900/50 transition-colors">
          Re-run
        </button>
      </div>
      {open && (
        <pre className="mt-2 p-3 rounded-lg bg-forest-900/[0.04] max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
          {data.output}
        </pre>
      )}
    </div>
  );
}
