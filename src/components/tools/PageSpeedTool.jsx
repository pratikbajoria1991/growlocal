"use client";
import { useState } from "react";
import { fieldClass, useToolRun, Field, ToolForm, ScoreHero, Stat, Limits, ProductCta, auditHref } from "./kit";

const RATING = { FAST: "Good", AVERAGE: "Needs work", SLOW: "Poor" };
const dot = (score) => (score >= 0.9 ? "bg-emerald-600" : score >= 0.5 ? "bg-amber-500" : "bg-rose-600");

export function PageSpeedTool() {
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState("mobile");
  const { loading, res, error, run } = useToolRun("/api/tools/page-speed");

  return (
    <div>
      <ToolForm
        label="Test your page speed"
        onSubmit={() => run({ url: url.trim(), strategy })}
        loading={loading}
        disabled={!url.trim()}
        button="Test my speed"
        busy="Google is loading your page"
        note="Free, no signup. Takes 15 to 40 seconds."
        error={error}
      >
        <Field id="ps-url" label="Page to test">
          <input id="ps-url" className={fieldClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourbusiness.com" inputMode="url" autoComplete="url" spellCheck={false} required />
        </Field>
        <fieldset>
          <legend className="block text-sm font-medium mb-1.5">Device</legend>
          <div className="flex gap-2">
            {["mobile", "desktop"].map((s) => (
              <label key={s} className={`min-h-[44px] inline-flex items-center gap-2 px-4 rounded-xl border hairline cursor-pointer capitalize ${strategy === s ? "border-indigo-600 bg-indigo-600/[0.06]" : "bg-white"}`}>
                <input type="radio" name="ps-strategy" value={s} checked={strategy === s} onChange={() => setStrategy(s)} className="accent-indigo-600" />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
      </ToolForm>

      <div aria-live="polite">{res && <Results res={res} />}</div>
    </div>
  );
}

function Results({ res }) {
  const { scores, lab, field, fieldOverall, opportunities } = res;
  const perf = scores.performance;
  const verdict = perf == null ? "Google couldn't score this page." : perf >= 90 ? "Fast. Visitors won't wait." : perf >= 50 ? "Okay, but visitors on slow phones will wait." : "Slow. Many mobile visitors will leave before it loads.";
  let host = res.url;
  try {
    host = new URL(res.url).hostname;
  } catch {}

  return (
    <div className="mt-8 space-y-8">
      <ScoreHero eyebrow={`${host} · ${res.strategy}`} headline={`Speed score ${perf ?? "—"}/100. ${verdict}`}>
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat k="Performance" v={scores.performance ?? "—"} />
          <Stat k="SEO" v={scores.seo ?? "—"} />
          <Stat k="Accessibility" v={scores.accessibility ?? "—"} />
          <Stat k="Best practices" v={scores.bestPractices ?? "—"} />
        </dl>
      </ScoreHero>

      {field.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-1">What real visitors experienced</h2>
          <p className="text-forest-900/70 mb-3">From Chrome users over the last 28 days{fieldOverall ? `. Overall: ${RATING[fieldOverall] || fieldOverall}` : ""}.</p>
          <ul className="grid sm:grid-cols-3 gap-3">
            {field.map((m) => (
              <li key={m.key} className="rounded-2xl border hairline bg-white p-4">
                <p className="text-sm text-forest-900/70">{m.label}</p>
                <p className="font-display text-2xl">{m.unit === "ms" ? `${(m.value / 1000).toFixed(1)}s` : m.value.toFixed(2)}</p>
                <p className="text-sm">{RATING[m.rating] || m.rating}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl mb-3">Lab test results</h2>
        <ul className="divide-y divide-forest-900/[0.07] rounded-2xl border hairline bg-white">
          {lab.map((m) => (
            <li key={m.id} className="p-4 flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot(m.score ?? 0)}`} aria-hidden="true" />
              <span className="flex-1">{m.label}</span>
              <span className="font-medium">{m.display}</span>
            </li>
          ))}
        </ul>
      </section>

      {opportunities.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-3">Biggest speed fixes</h2>
          <ul className="space-y-2">
            {opportunities.map((o) => (
              <li key={o.id} className="rounded-2xl border hairline bg-white p-4 flex items-center justify-between gap-3">
                <span>{o.title}</span>
                <span className="text-sm text-forest-900/70 whitespace-nowrap">saves ~{(o.savingsMs / 1000).toFixed(1)}s</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Limits>
        this is one test of one page by Google&apos;s Lighthouse. Scores move a few points between runs. Real-visitor data only appears
        for sites with enough Chrome traffic.
      </Limits>

      <ProductCta
        title="Speed is one part of being found"
        body="The free Growlocal audit checks the rest: search basics, Google Maps signals and whether AI assistants can quote you."
        href={auditHref(res.url)}
      />
    </div>
  );
}
