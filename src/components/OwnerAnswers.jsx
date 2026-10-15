"use client";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";

// The owner answers the crew's open questions in one go.
export function OwnerAnswers({ clientId, questions }) {
  const [vals, setVals] = useState({});
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const filled = questions.filter((q) => (vals[q] || "").trim());

  async function submit(e) {
    e.preventDefault();
    setState("saving"); setError(null);
    try {
      const r = await fetch("/api/owner/answers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, answers: filled.map((q) => ({ q, a: vals[q] })) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't save.");
      setState("saved");
    } catch (err) { setError(err.message); setState(null); }
  }

  if (state === "saved") {
    return <p className="text-sm text-emerald-800 inline-flex items-center gap-2"><Check className="w-4 h-4" /> Thank you. We&apos;ll use these in your next update.</p>;
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      {questions.map((q, i) => (
        <label key={q} className="block">
          <span className="block text-sm mb-1.5">{q}</span>
          <textarea
            id={`oa-${i}`}
            value={vals[q] || ""}
            onChange={(e) => setVals({ ...vals, [q]: e.target.value })}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-white outline-none focus:border-indigo-500/60 text-[16px]"
          />
        </label>
      ))}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button disabled={!filled.length || state === "saving"} className="min-h-[44px] px-5 rounded-xl btn-premium text-white text-sm font-medium inline-flex items-center gap-2 disabled:opacity-40">
        {state === "saving" && <Loader2 className="w-4 h-4 animate-spin" />} Send {filled.length || ""} answer{filled.length === 1 ? "" : "s"}
      </button>
      <p className="text-xs text-forest-900/65">Only answer what you&apos;re sure of. Anything you skip, we leave out rather than guess.</p>
    </form>
  );
}
