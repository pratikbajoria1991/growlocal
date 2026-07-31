"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export function WaitlistForm({ dark = false }) {
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [state, setState] = useState({ loading: false, done: false, error: null, message: null });

  async function submit(e) {
    e.preventDefault();
    setState({ loading: true, done: false, error: null, message: null });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, site }),
      });
      const data = await res.json();
      if (!res.ok) return setState({ loading: false, done: false, error: data.error, message: null });
      setState({ loading: false, done: true, error: null, message: data.message || null });
    } catch (err) {
      setState({ loading: false, done: false, error: err.message, message: null });
    }
  }

  if (state.done) {
    return (
      <div className={`rounded-2xl p-6 ${dark ? "bg-canvas-50/10 border border-canvas-50/15" : "border hairline bg-white"}`}>
        <CheckCircle2 className="w-5 h-5 text-lime-500 mb-2.5" />
        <div className={`font-medium mb-1.5 ${dark ? "text-canvas-50" : ""}`}>You&apos;re on the list.</div>
        <p className={`text-sm leading-relaxed ${dark ? "text-canvas-50/70" : "text-forest-900/60"}`}>
          {state.message || "We're onboarding in small batches while Google reviews our app. You'll hear from us as soon as a slot opens."}
        </p>
      </div>
    );
  }

  const inputCls = dark
    ? "w-full px-4 py-3 rounded-xl bg-canvas-50/10 border border-canvas-50/15 text-canvas-50 placeholder:text-canvas-50/35 outline-none focus:border-lime-500/60 transition-colors"
    : "w-full px-4 py-3 rounded-xl border hairline bg-white outline-none focus:border-lime-500/60 transition-colors";

  return (
    <form onSubmit={submit} className="space-y-2.5 max-w-md">
      <input
        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="you@yourbusiness.com" autoComplete="email"
        data-lpignore="true" data-1p-ignore="true" suppressHydrationWarning
        className={inputCls}
      />
      <input
        type="text" value={site} onChange={(e) => setSite(e.target.value)}
        placeholder="Your website (optional)" suppressHydrationWarning
        className={inputCls}
      />
      <button
        type="submit" disabled={state.loading || !email}
        className={`w-full px-5 py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
          dark ? "bg-lime-500 text-forest-900 hover:bg-lime-400" : "bg-forest-900 text-canvas-50 hover:bg-forest-800"
        }`}
      >
        {state.loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</> : <>Join the waitlist <ArrowRight className="w-4 h-4" /></>}
      </button>
      {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
      <p className={`text-xs leading-relaxed ${dark ? "text-canvas-50/45" : "text-forest-900/40"}`}>
        No spam. One email when your slot opens.
      </p>
    </form>
  );
}
