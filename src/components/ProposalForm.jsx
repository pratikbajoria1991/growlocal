"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

const STEPS = [
  "Finding your business on Google Maps…",
  "Looking up your nearest competitors…",
  "Checking where you appear in Google's results…",
  "Auditing your website for Google and AI search…",
  "Ranking what to fix first…",
];

export function ProposalForm({ compact = false, onCreated }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 6000);
    return () => clearInterval(t);
  }, [busy]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, website }),
      });
      const data = await res.json();
      if (!res.ok) { setBusy(false); return setError(data.error || "Couldn't build the proposal."); }
      if (onCreated) { setBusy(false); setInput(""); setWebsite(""); return onCreated(data); }
      router.push(data.url);
    } catch (err) {
      setBusy(false);
      setError(err.message);
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border hairline bg-white outline-none focus:border-indigo-500/60 transition-colors text-sm";

  return (
    <form onSubmit={submit} className={compact ? "grid sm:grid-cols-[1fr_1fr_auto] gap-2.5" : "space-y-2.5 max-w-xl"}>
      <label className="block">
        <span className="sr-only">Google Maps link or business name and area</span>
        <input
          required value={input} onChange={(e) => setInput(e.target.value)} disabled={busy}
          placeholder="Google Maps link, or business name and area"
          className={inputCls} suppressHydrationWarning
        />
      </label>
      <label className="block">
        <span className="sr-only">Website (optional)</span>
        <input
          value={website} onChange={(e) => setWebsite(e.target.value)} disabled={busy}
          placeholder="Website (optional — we'll use the one on Google)"
          className={inputCls} suppressHydrationWarning
        />
      </label>
      <button
        type="submit" disabled={busy || input.trim().length < 3}
        className="px-5 py-3 rounded-xl btn-premium text-white font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Building…</> : <>{compact ? "Generate" : "Get my free proposal"} <ArrowRight className="w-4 h-4" /></>}
      </button>
      {busy && (
        <p className={`text-sm text-forest-900/60 ${compact ? "sm:col-span-3" : ""}`} aria-live="polite">
          {STEPS[step]} This takes about 30 seconds.
        </p>
      )}
      {error && <p className={`text-sm text-rose-500 ${compact ? "sm:col-span-3" : ""}`}>{error}</p>}
    </form>
  );
}
