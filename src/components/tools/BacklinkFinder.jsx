"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2, Circle, Search, ExternalLink, ShieldCheck } from "lucide-react";

const CATEGORIES = [
  ["clinic", "Clinic or doctor"], ["dental", "Dental clinic"], ["food", "Restaurant or cafe"], ["realestate", "Real estate"],
  ["wedding", "Wedding venue or events"], ["interiors", "Interior design or home services"], ["salon", "Salon or spa"],
  ["hotel", "Hotel"], ["auto", "Car dealer or service"], ["professional", "Lawyer, CA or consultant"],
  ["education", "Coaching or education"], ["shop", "Shop or retail"], ["other", "Something else"],
];

const field = "w-full rounded-xl border hairline bg-white px-4 py-3 text-[16px] focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_0_4px_rgba(34,197,94,0.15)]";

export function BacklinkFinder() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("other");
  const [competitor, setCompetitor] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError(null); setRes(null);
    try {
      const r = await fetch("/api/tools/backlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), category, competitor: competitor.trim(), name: name.trim() }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error || "The check failed.");
      else setRes(d);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    }
    setLoading(false);
  }

  return (
    <div>
      <form onSubmit={submit} className="rounded-3xl border hairline bg-white p-4 sm:p-5 shadow-lift space-y-3" aria-label="Find backlink and citation opportunities">
        <div>
          <label htmlFor="bl-url" className="block text-sm font-medium mb-1.5">Your website</label>
          <input id="bl-url" className={field} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourbusiness.com" inputMode="url" autoComplete="url" spellCheck={false} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="bl-name" className="block text-sm font-medium mb-1.5">Business name <span className="font-normal text-forest-900/65">(optional)</span></label>
            <input id="bl-name" className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on Google" autoComplete="organization" />
          </div>
          <div>
            <label htmlFor="bl-cat" className="block text-sm font-medium mb-1.5">Type of business</label>
            <select id="bl-cat" className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="bl-comp" className="block text-sm font-medium mb-1.5">Competitor website <span className="font-normal text-forest-900/65">(optional)</span></label>
            <input id="bl-comp" className={field} value={competitor} onChange={(e) => setCompetitor(e.target.value)} placeholder="competitor.com" inputMode="url" spellCheck={false} />
          </div>
        </div>
        <button type="submit" disabled={loading || !url.trim()} className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 rounded-xl btn-premium text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Checking your site</> : <>Find my opportunities <Search className="w-4 h-4" aria-hidden="true" /></>}
        </button>
        <p className="text-xs text-forest-900/70">Free, no signup. Takes about 10 seconds.</p>
        {error && (
          <p role="alert" className="flex items-start gap-2 text-sm text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> {error}
          </p>
        )}
      </form>

      <div aria-live="polite">
        {res && <Results res={res} />}
      </div>
    </div>
  );
}

function Results({ res }) {
  const { site, summary, platforms, competitor, mentions } = res;
  const missing = platforms.filter((p) => !p.linkedFromSite);
  const linked = platforms.filter((p) => p.linkedFromSite);
  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-3xl bg-forest-900 text-canvas-50 p-6 sm:p-7">
        <p className="text-sm text-canvas-50/75 mb-1">{site.host}</p>
        <p className="font-display text-3xl sm:text-4xl leading-tight mb-3">
          Your site links to {summary.linked} of {summary.recommended} profiles that matter for your business.
        </p>
        <p className="text-canvas-50/75 leading-relaxed">
          {summary.missing === 0
            ? "Every recommended profile is linked from your homepage. The next gains come from earning links from other sites."
            : `${summary.missing} are not linked from your homepage. Linking them tells Google and AI assistants these profiles are really you.`}
          {competitor && !competitor.error && ` Your competitor (${competitor.host}) links to ${competitor.linked}.`}
        </p>
        <p className="mt-2 text-sm text-canvas-50/75">Listing searches use the name &quot;{site.name}&quot;. If that&apos;s not your business name, add it above and run again.</p>
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat k="HTTPS" v={site.https ? "Yes" : "No"} />
          <Stat k="Sitemap" v={site.sitemap ? `${site.sitemap.urls} URLs` : "Not found"} />
          <Stat k="External links" v={`${site.links.external} (${site.links.nofollow} nofollow)`} />
          <Stat k="Domain registered" v={site.registered || "Unknown"} />
        </dl>
      </section>

      {competitor?.gaps?.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-2">Where your competitor is ahead</h2>
          <p className="text-forest-900/70 mb-3">{competitor.host} links to these profiles and you don&apos;t: {competitor.gaps.join(", ")}.</p>
        </section>
      )}
      {competitor?.error && <p className="text-sm text-forest-900/70">We couldn&apos;t check the competitor site: {competitor.error}</p>}

      {missing.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-1">Profiles to claim and link</h2>
          <p className="text-forest-900/70 mb-4">Check each listing, create it if it doesn&apos;t exist, then link to it from your website.</p>
          <ul className="divide-y divide-forest-900/[0.07] rounded-2xl border hairline bg-white">
            {missing.map((p) => (
              <li key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <Circle className="hidden sm:block w-4 h-4 text-forest-900/65 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.name}{p.competitorLinks ? <span className="ml-2 text-xs font-normal text-amber-800 bg-amber-500/15 rounded-full px-2 py-0.5">competitor has it</span> : null}</p>
                  <p className="text-sm text-forest-900/70">{p.why}</p>
                </div>
                <a href={p.checkListing} target="_blank" rel="noopener noreferrer" className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 rounded-xl border hairline text-sm font-medium hover:bg-forest-900/[0.04] whitespace-nowrap">
                  Am I listed? <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {linked.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-3">Already linked from your site</h2>
          <ul className="flex flex-wrap gap-2">
            {linked.map((p) => (
              <li key={p.id} className="inline-flex items-center gap-1.5 rounded-full border hairline bg-white px-3 py-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" /> {p.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl mb-1">Links you can win this week</h2>
        <p className="text-forest-900/70 mb-4">These searches find sites that already mention you. Asking them to add a link is the fastest honest way to earn backlinks.</p>
        <ul className="space-y-3">
          {mentions.map((m) => (
            <li key={m.url} className="rounded-2xl border hairline bg-white p-4">
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-700 hover:underline inline-flex items-center gap-1.5 min-h-[44px]">
                {m.label} <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <p className="text-sm text-forest-900/70 mt-1">{m.why}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-canvas-100 border hairline p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-forest-900/75 leading-relaxed"><strong className="font-medium">What this check can&apos;t see:</strong> {res.cannotSee}</p>
      </section>

      <section className="rounded-3xl border-2 border-indigo-600 bg-white p-6 sm:p-7">
        <h2 className="font-display text-2xl mb-2">Want the full picture for {site.host}?</h2>
        <p className="text-forest-900/70 mb-5">The free Growlocal audit scores your website for Google search, Google Maps and AI assistants, and lists every fix in order.</p>
        <Link href={`/audit?url=${encodeURIComponent(site.url)}`} className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 rounded-xl btn-premium text-white font-medium w-full sm:w-auto">
          Run my free audit <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

function Stat({ k, v }) {
  return (
    <div className="rounded-xl bg-canvas-50/10 p-3">
      <dt className="text-canvas-50/75 text-xs mb-0.5">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
