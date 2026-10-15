"use client";
// Shared building blocks for the free tool forms and results.
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

export const fieldClass =
  "w-full rounded-xl border hairline bg-white px-4 py-3 text-[16px] focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]";

export function useToolRun(endpoint) {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);

  async function run(payload) {
    setLoading(true);
    setError(null);
    setRes(null);
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setError(d.error || "The check failed.");
      else setRes(d);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    }
    setLoading(false);
  }
  return { loading, res, error, run };
}

export function Field({ id, label, optional, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label} {optional && <span className="font-normal text-forest-900/65">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

export function ToolForm({ onSubmit, label, loading, disabled, button, busy, note, error, children }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && !loading) onSubmit();
      }}
      className="rounded-3xl border hairline bg-white p-4 sm:p-5 shadow-lift space-y-3"
      aria-label={label}
    >
      {children}
      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 rounded-xl btn-premium text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {busy}
          </>
        ) : (
          <>
            {button} <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </>
        )}
      </button>
      <p className="text-xs text-forest-900/70">{note}</p>
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
    </form>
  );
}

export function ScoreHero({ eyebrow, headline, body, children }) {
  return (
    <section className="rounded-3xl bg-forest-900 text-canvas-50 p-6 sm:p-7">
      {eyebrow && <p className="text-sm text-canvas-50/75 mb-1 break-all">{eyebrow}</p>}
      <p className="font-display text-3xl sm:text-4xl leading-tight mb-3 text-balance">{headline}</p>
      {body && <p className="text-canvas-50/75 leading-relaxed">{body}</p>}
      {children}
    </section>
  );
}

export function Stat({ k, v }) {
  return (
    <div className="rounded-xl bg-canvas-50/10 p-3">
      <dt className="text-canvas-50/75 text-xs mb-0.5">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

export function Limits({ children }) {
  return (
    <section className="rounded-2xl bg-canvas-100 border hairline p-4">
      <p className="text-sm text-forest-900/75 leading-relaxed">
        <strong className="font-medium">What this check can&apos;t see:</strong> {children}
      </p>
    </section>
  );
}

// The single product call to action every tool ends on.
export function ProductCta({ title, body, href = "/audit", label = "Run my free audit" }) {
  return (
    <section className="rounded-3xl border-2 border-indigo-600 bg-white p-6 sm:p-7">
      <h2 className="font-display text-2xl mb-2 text-balance">{title}</h2>
      <p className="text-forest-900/70 mb-5">{body}</p>
      <Link href={href} className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 rounded-xl btn-premium text-white font-medium w-full sm:w-auto">
        {label} <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

export const auditHref = (url) => (url ? `/audit?url=${encodeURIComponent(url)}` : "/audit");
