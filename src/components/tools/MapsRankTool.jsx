"use client";
import { useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import { fieldClass, useToolRun, Field, ToolForm, ScoreHero, Stat, Limits, ProductCta } from "./kit";

export function MapsRankTool() {
  const [business, setBusiness] = useState("");
  const [keyword, setKeyword] = useState("");
  const [area, setArea] = useState("");
  const { loading, res, error, run } = useToolRun("/api/tools/maps-rank");
  const ready = business.trim() && keyword.trim() && area.trim();

  return (
    <div>
      <ToolForm
        label="Check your Google Maps ranking"
        onSubmit={() => run({ business: business.trim(), keyword: keyword.trim(), area: area.trim() })}
        loading={loading}
        disabled={!ready}
        button="Check my ranking"
        busy="Searching Google Maps"
        note="Free, no signup. Takes about 3 seconds."
        error={error}
      >
        <Field id="mr-biz" label="Your business name or website">
          <input id="mr-biz" className={fieldClass} value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="As it appears on Google, or yourbusiness.com" required />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field id="mr-kw" label="What customers search">
            <input id="mr-kw" className={fieldClass} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="dentist" required />
          </Field>
          <Field id="mr-area" label="Area">
            <input id="mr-area" className={fieldClass} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Salt Lake, Kolkata" required />
          </Field>
        </div>
      </ToolForm>

      <div aria-live="polite">{res && <Results res={res} />}</div>
    </div>
  );
}

function Results({ res }) {
  const { position, range, you, results, top3Average } = res;
  const spread = range && (range.best !== range.worst || range.seenIn < range.runs)
    ? ` Google's order shifts between searches: across ${range.runs} checks you appeared ${range.seenIn === range.runs ? "every time" : `${range.seenIn} of ${range.runs} times`}, between #${range.best} and #${range.worst}.`
    : "";
  const headline = position
    ? position <= 3
      ? `You're usually #${position} on Google Maps. That's the top three.`
      : `You're usually #${position} on Google Maps for this search.`
    : range
      ? `You only sometimes appear in the top 20 for this search.`
      : "You're not in the top 20 on Google Maps for this search.";
  const body = position
    ? position <= 3
      ? "Most map clicks go to the top three. Keep your reviews and profile fresh to hold the spot."
      : "Most map clicks go to the top three. The table below shows what they have that you don't."
    : `If your business is listed, check the name matches Google exactly, or try your website instead. Otherwise, the top three below are who customers see.`;

  return (
    <div className="mt-8 space-y-8">
      <ScoreHero eyebrow={`"${res.query}"`} headline={headline} body={body + spread}>
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat k="Your rating" v={you?.rating ? `${you.rating} ★` : "—"} />
          <Stat k="Your reviews" v={you ? you.reviews : "—"} />
          <Stat k="Top 3 avg rating" v={top3Average.rating ? `${top3Average.rating} ★` : "—"} />
          <Stat k="Top 3 avg reviews" v={top3Average.reviews} />
        </dl>
      </ScoreHero>

      <section>
        <h2 className="font-display text-2xl mb-1">Who ranks for this search</h2>
        <p className="text-forest-900/70 mb-3">The order from the first of the {range?.runs || 3} checks.</p>
        <ol className="divide-y divide-forest-900/[0.07] rounded-2xl border hairline bg-white">
          {results.slice(0, 10).map((p) => (
            <li key={p.position} className={`p-4 flex items-center gap-3 ${p.isYou ? "bg-indigo-600/[0.06]" : ""}`}>
              <span className="w-8 text-center font-display text-lg shrink-0">{p.position}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {p.name} {p.isYou && <span className="ml-1 text-xs font-normal text-indigo-800 bg-indigo-600/10 rounded-full px-2 py-0.5">you</span>}
                </p>
                <p className="text-sm text-forest-900/70 flex items-center gap-1.5 flex-wrap">
                  {p.rating ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" aria-hidden="true" /> {p.rating}
                    </span>
                  ) : (
                    <span>No rating</span>
                  )}
                  <span>· {p.reviews} reviews</span>
                  {p.website ? <span>· {p.website}</span> : <span>· no website</span>}
                </p>
              </div>
              {p.mapsUrl && (
                <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.name} on Google Maps`} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:bg-forest-900/[0.04]">
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>

      <Limits>
        this is Google&apos;s ranking for the search as typed, not from one particular street. People searching on their phone nearby
        may see a slightly different order, because Google also weighs how close they are.
      </Limits>

      <ProductCta
        title="Find out what's holding your Maps ranking back"
        body="The free Growlocal audit checks your Google Business Profile, reviews and website against the businesses above, and lists every fix."
      />
    </div>
  );
}
