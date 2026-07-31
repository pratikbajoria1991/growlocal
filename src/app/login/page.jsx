"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ loading: false, sent: false, error: null, devLink: null });

  async function submit(e) {
    e.preventDefault();
    setState({ loading: true, sent: false, error: null, devLink: null });
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return setState({ loading: false, sent: false, error: data.error, devLink: null });
      setState({ loading: false, sent: true, error: null, devLink: data.devLink || null });
    } catch (err) {
      setState({ loading: false, sent: false, error: err.message, devLink: null });
    }
  }

  return (
    <section className="max-w-md mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20">
      <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">Sign in or sign up</div>
      <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-3">
        One link. <span className="text-lime-600">No password.</span>
      </h1>
      <p className="text-forest-900/60 leading-relaxed mb-8">
        Enter your email and we&apos;ll send a one-time sign-in link. New here? Your account is created automatically on first use.
      </p>

      {!state.sent ? (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.com"
            autoComplete="email"
            data-lpignore="true"
            data-1p-ignore="true"
            suppressHydrationWarning
            className="w-full px-4 py-3.5 rounded-xl border hairline bg-white outline-none focus:border-lime-500/60 transition-colors"
          />
          <button
            type="submit"
            disabled={state.loading || !email}
            className="w-full px-5 py-3.5 rounded-xl bg-forest-900 text-canvas-50 font-medium hover:bg-forest-800 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition-colors"
          >
            {state.loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Mail className="w-4 h-4" /> Email me a sign-in link</>}
          </button>
          {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
        </form>
      ) : (
        <div className="rounded-2xl border hairline bg-white p-6">
          <CheckCircle2 className="w-5 h-5 text-lime-600 mb-3" />
          <div className="font-medium mb-1.5">Link sent to {email}</div>
          <p className="text-sm text-forest-900/60 leading-relaxed">
            Click it within 30 minutes to sign in. Check spam if it doesn&apos;t arrive.
          </p>
          {state.devLink && (
            <div className="mt-4 p-3 rounded-lg bg-lime-500/[0.08] border border-lime-500/25">
              <div className="text-[10px] uppercase tracking-wider text-lime-600 font-semibold mb-1">Dev mode — no mail service configured</div>
              <a href={state.devLink} className="text-xs text-forest-900/70 underline break-all hover:text-forest-900">{state.devLink}</a>
            </div>
          )}
          <button onClick={() => setState({ loading: false, sent: false, error: null, devLink: null })} className="mt-4 text-sm text-forest-900/45 hover:text-forest-900">
            ← Use a different email
          </button>
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl bg-forest-900/[0.03] border hairline">
        <p className="text-sm text-forest-900/60 leading-relaxed">
          Looking for <strong className="text-forest-900">GBP Autopilot</strong>? We&apos;re onboarding in batches while Google reviews our Business Profile access.{" "}
          <Link href="/autopilot" className="text-lime-600 underline">Join the waitlist</Link> — or run the{" "}
          <Link href="/audit" className="text-lime-600 underline">free audit</Link>, which needs no account at all.
        </p>
      </div>

      <p className="text-xs text-forest-900/40 mt-6 leading-relaxed">
        By signing in you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </section>
  );
}
