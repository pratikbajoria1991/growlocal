import { ShieldCheck, UserCheck, HandHelping } from "lucide-react";

// A faithful miniature of the real report. The numbers come from one real audit
// of an eye clinic (business not named) — see the caption.
const CATS = [
  { k: "SEO", label: "Search", v: 20, c: "#22c55e" },
  { k: "AEO", label: "AI answers", v: 12, c: "#0ea5e9" },
  { k: "GEO", label: "Local", v: 6, c: "#f59e0b" },
];
const ISSUES = [
  { who: "We do it", icon: ShieldCheck, t: "Website unreadable to AI assistants", e: "AEO 12/100 — no FAQ or question-led answers" },
  { who: "Needs your OK", icon: UserCheck, t: "Not in Google's top 20 for its own category and area", e: "Measured from a live Google search" },
  { who: "Needs your help", icon: HandHelping, t: "2 reviews vs a median of 105", e: "Top 3 results for the same search" },
];

export function ReportMock() {
  const R = 44;
  const C = 2 * Math.PI * R;
  const score = 13;
  return (
    <figure className="relative">
      <div className="relative rounded-3xl bg-white border hairline shadow-[0_24px_80px_rgba(10,31,22,0.14)] overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b hairline bg-forest-900/[0.02]" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-forest-900/10" />
          <span className="w-2.5 h-2.5 rounded-full bg-forest-900/10" />
          <span className="w-2.5 h-2.5 rounded-full bg-forest-900/10" />
          <span className="ml-3 text-[11px] text-forest-900/65 font-mono">growlocal · audit report</span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 110 110" className="w-24 h-24 shrink-0 -rotate-90" role="img" aria-label={`Visibility score ${score} out of 100`}>
              <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(10,31,22,0.07)" strokeWidth="9" />
              <circle cx="55" cy="55" r={R} fill="none" stroke="#22c55e" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} className="ring-arc" />
            </svg>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-1">Visibility score</div>
              <div className="font-display text-4xl leading-none tabular-nums">
                {score}
                <span className="text-lg text-forest-900/65">/100</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {CATS.map((c) => (
                  <div key={c.k} className="flex items-center gap-2 text-[11px]">
                    <span className="w-16 text-forest-900/70">{c.label}</span>
                    <span className="flex-1 h-1.5 rounded-full bg-forest-900/[0.07] overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: `${c.v}%`, background: c.c }} />
                    </span>
                    <span className="w-6 text-right tabular-nums text-forest-900/60">{c.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {ISSUES.map((i) => (
              <li key={i.t} className="flex items-start gap-3 rounded-xl border hairline p-3">
                <span className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <i.icon className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-snug">{i.t}</span>
                  <span className="block text-[11.5px] text-forest-900/70 mt-0.5">{i.e}</span>
                </span>
                <span className="ml-auto shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-forest-900/[0.05] text-forest-900/60 whitespace-nowrap">{i.who}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="mt-3 text-[11px] text-forest-900/65 text-center">Sample report — numbers from a real audit of an eye clinic, name withheld.</figcaption>
    </figure>
  );
}
