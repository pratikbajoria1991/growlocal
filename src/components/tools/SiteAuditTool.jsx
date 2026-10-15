"use client";
import { useState } from "react";
import { fieldClass, useToolRun, Field, ToolForm, ScoreHero, Stat, Limits, ProductCta, auditHref } from "./kit";

const SEV = {
  high: "bg-rose-600/10 text-rose-800",
  medium: "bg-amber-500/15 text-amber-800",
  low: "bg-forest-900/[0.06] text-forest-900/75",
  info: "bg-indigo-600/10 text-indigo-800",
};

const path = (u) => {
  try {
    const x = new URL(u);
    return x.pathname + x.search || "/";
  } catch {
    return u;
  }
};

export function SiteAuditTool() {
  const [url, setUrl] = useState("");
  const { loading, res, error, run } = useToolRun("/api/tools/site-audit");

  return (
    <div>
      <ToolForm
        label="Audit your website"
        onSubmit={() => run({ url: url.trim() })}
        loading={loading}
        disabled={!url.trim()}
        button="Audit my site"
        busy="Crawling up to 25 pages"
        note="Free, no signup. Takes 10 to 40 seconds."
        error={error}
      >
        <Field id="sa-url" label="Your website">
          <input id="sa-url" className={fieldClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourbusiness.com" inputMode="url" autoComplete="url" spellCheck={false} required />
        </Field>
      </ToolForm>

      <div aria-live="polite">{res && <Results res={res} />}</div>
    </div>
  );
}

function Results({ res }) {
  const { site, summary, issues, score } = res;
  return (
    <div className="mt-8 space-y-8">
      <ScoreHero
        eyebrow={site.host}
        headline={`Site health ${score}/100 across ${summary.crawled} pages.`}
        body={
          issues.length === 0
            ? "We found no issues on the pages we crawled."
            : `${issues.length} kinds of issue found, ${summary.high} of them high priority. Fix the top of the list first.`
        }
      >
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat k="Pages crawled" v={summary.crawled} />
          <Stat k="Pages with errors" v={summary.errors} />
          <Stat k="Sitemap" v={site.sitemap ? `${site.sitemapUrls} URLs` : "Not found"} />
          <Stat k="robots.txt" v={site.robotsTxt ? "Found" : "Missing"} />
        </dl>
        {summary.limited && <p className="mt-3 text-sm text-canvas-50/75">Your site has more pages than this free check crawls. These results cover the first {summary.crawled}.</p>}
      </ScoreHero>

      {issues.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-3">Issues to fix, most important first</h2>
          <ul className="space-y-3">
            {issues.map((i) => (
              <li key={i.type} className="rounded-2xl border hairline bg-white">
                <details className="group p-4">
                  <summary className="cursor-pointer list-none flex flex-wrap items-center gap-2 min-h-[44px]">
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 capitalize ${SEV[i.severity]}`}>{i.severity}</span>
                    <span className="font-medium flex-1 min-w-[12rem]">{i.label}</span>
                    <span className="text-sm text-forest-900/70">{i.count} {i.count === 1 ? "page" : "pages"}</span>
                  </summary>
                  <p className="mt-2 text-sm text-forest-900/75">{i.fix}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {i.pages.map((p) => (
                      <li key={p.url + (p.detail || "")} className="break-all text-forest-900/70">
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">{path(p.url)}</a>
                        {p.detail ? <span> · {p.detail}</span> : null}
                      </li>
                    ))}
                    {i.count > i.pages.length && <li className="text-forest-900/65">and {i.count - i.pages.length} more</li>}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Limits>
        this free check reads up to 25 pages as plain HTML, without running JavaScript, so content added by scripts may be missed. It
        doesn&apos;t measure speed in a browser or check your Google Business Profile.
      </Limits>

      <ProductCta
        title={`Is ${site.host} visible on Google Maps and in AI answers too?`}
        body="The free Growlocal audit scores your homepage for Google search, Google Maps and AI assistants, and lists every fix in order."
        href={auditHref(site.url)}
      />
    </div>
  );
}
