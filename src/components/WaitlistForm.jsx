"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

// Founding-client application. Owners reach us fastest on WhatsApp, so a
// phone number is asked for alongside email — it's how approvals will flow.
export function WaitlistForm({ dark = false, initial, proposalId }) {
  const [fields, setFields] = useState({ email: "", business: "", phone: "", site: "", ...initial });
  const [state, setState] = useState({ loading: false, done: false, error: null, message: null });
  const setField = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setState({ loading: true, done: false, error: null, message: null });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, proposalId }),
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
      <div className={`rounded-2xl p-6 ${dark ? "bg-canvas-50/10 border border-canvas-50/15" : "border hairline bg-canvas-50"}`}>
        <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2.5" />
        <div className={`font-medium mb-1.5 ${dark ? "text-canvas-50" : ""}`}>Application received.</div>
        <p className={`text-sm leading-relaxed ${dark ? "text-canvas-50/70" : "text-forest-900/60"}`}>
          {state.message || "We'll review your Google profile and website, then reach out within two working days to talk through what we'd fix first."}
        </p>
      </div>
    );
  }

  const inputCls = dark
    ? "w-full px-4 py-3 rounded-xl bg-canvas-50/10 border border-canvas-50/15 text-canvas-50 placeholder:text-canvas-50/35 outline-none focus:border-indigo-500/60 transition-colors"
    : "w-full px-4 py-3 rounded-xl border hairline bg-white outline-none focus:border-indigo-500/60 transition-colors";

  return (
    <form onSubmit={submit} className="space-y-2.5 max-w-md">
      <label className="block">
        <span className="sr-only">Business name</span>
        <input
          type="text" required value={fields.business} onChange={setField("business")}
          placeholder="Business name" autoComplete="organization" suppressHydrationWarning
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="sr-only">Email</span>
        <input
          type="email" required value={fields.email} onChange={setField("email")}
          placeholder="you@yourbusiness.com" autoComplete="email"
          data-lpignore="true" data-1p-ignore="true" suppressHydrationWarning
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="sr-only">WhatsApp number</span>
        <input
          type="tel" value={fields.phone} onChange={setField("phone")}
          placeholder="WhatsApp number (optional)" autoComplete="tel" suppressHydrationWarning
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="sr-only">Website or Google Maps link</span>
        <input
          type="text" value={fields.site} onChange={setField("site")}
          placeholder="Website or Google Maps link (optional)" suppressHydrationWarning
          className={inputCls}
        />
      </label>
      <button
        type="submit" disabled={state.loading || !fields.email || !fields.business}
        className={`w-full px-5 py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
          dark ? "btn-premium text-white" : "bg-forest-900 text-canvas-50 hover:bg-forest-800"
        }`}
      >
        {state.loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Apply <ArrowRight className="w-4 h-4" /></>}
      </button>
      {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
      <p className={`text-xs leading-relaxed ${dark ? "text-canvas-50/75" : "text-forest-900/65"}`}>
        No payment now. We only use these details to contact you about your application.
      </p>
    </form>
  );
}
