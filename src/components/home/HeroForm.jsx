"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

// One field, two kinds of input: a website or a Google Maps link. Hands off to
// /audit, which starts the audit immediately — no second form to fill in.
export function HeroForm() {
  const router = useRouter();
  const [v, setV] = useState("");
  function go(e) {
    e.preventDefault();
    const s = v.trim();
    if (!s) return router.push("/audit");
    const isMaps = /google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page|maps\.google/i.test(s);
    router.push(`/audit?${isMaps ? "link" : "url"}=${encodeURIComponent(s)}`);
  }
  return (
    <form onSubmit={go} className="w-full max-w-xl" aria-label="Free visibility audit">
      <label htmlFor="hero-input" className="sr-only">Your website or Google Maps link</label>
      <div className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-2xl bg-white border hairline shadow-lift focus-within:border-indigo-500/50 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.12)] transition-shadow">
        <input
          id="hero-input"
          value={v}
          onChange={(e) => setV(e.target.value)}
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="Your website or Google Maps link"
          className="flex-1 min-w-0 bg-transparent px-4 py-3 text-[15px] placeholder:text-forest-900/65 focus:outline-none"
        />
        <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl btn-premium text-white font-medium text-[15px] whitespace-nowrap">
          Audit it free <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2.5 text-xs text-forest-900/65 px-1">Free, no signup, results in seconds</p>
    </form>
  );
}
