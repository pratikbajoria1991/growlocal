"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { fieldClass, useToolRun, Field, ToolForm, ScoreHero, Limits, ProductCta } from "./kit";

const GROUPS = [
  ["local", "Local searches", "People looking for a business nearby. Use these on your Google Business Profile and service pages."],
  ["questions", "Questions people ask", "Answer these in an FAQ. AI assistants quote clear answers to questions like these."],
  ["commercial", "Ready-to-buy searches", "Searches about price, reviews and the best option. Good for service and pricing pages."],
  ["other", "Other related searches", "Wider topics around your service. Useful for blog posts and new pages."],
];

export function KeywordIdeasTool() {
  const [seed, setSeed] = useState("");
  const [area, setArea] = useState("");
  const { loading, res, error, run } = useToolRun("/api/tools/keyword-ideas");

  return (
    <div>
      <ToolForm
        label="Find keyword ideas"
        onSubmit={() => run({ seed: seed.trim(), area: area.trim() })}
        loading={loading}
        disabled={seed.trim().length < 2}
        button="Find keywords"
        busy="Asking Google"
        note="Free, no signup. Takes about 5 seconds."
        error={error}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Field id="kw-seed" label="Your service or product">
            <input id="kw-seed" className={fieldClass} value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="dentist" required />
          </Field>
          <Field id="kw-area" label="Your area" optional>
            <input id="kw-area" className={fieldClass} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Salt Lake" />
          </Field>
        </div>
      </ToolForm>

      <div aria-live="polite">{res && <Results res={res} />}</div>
    </div>
  );
}

function Results({ res }) {
  const [copied, setCopied] = useState(null);
  const copy = async (key, list) => {
    try {
      await navigator.clipboard.writeText(list.join("\n"));
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <div className="mt-8 space-y-8">
      <ScoreHero
        eyebrow={res.area ? `${res.seed} · ${res.area}` : res.seed}
        headline={`${res.total} real searches people type into Google.`}
        body="Every idea below comes straight from Google's search suggestions, so people are actively searching for it."
      />

      {GROUPS.map(([key, title, why]) => {
        const list = res.groups[key];
        if (!list?.length) return null;
        return (
          <section key={key}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="font-display text-2xl">
                {title} <span className="text-forest-900/65 text-lg">({list.length})</span>
              </h2>
              <button type="button" onClick={() => copy(key, list)} className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl border hairline text-sm shrink-0 hover:bg-forest-900/[0.04]">
                {copied === key ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied === key ? "Copied" : "Copy all"}
              </button>
            </div>
            <p className="text-forest-900/70 mb-3">{why}</p>
            <ul className="flex flex-wrap gap-2">
              {list.slice(0, 60).map((k) => (
                <li key={k} className="rounded-full border hairline bg-white px-3 py-1.5 text-sm">{k}</li>
              ))}
            </ul>
          </section>
        );
      })}

      <Limits>
        Google&apos;s suggestions don&apos;t include monthly search volumes or difficulty, so ideas are grouped by intent, not ranked by
        traffic. Suggestions can vary by location and day.
      </Limits>

      <ProductCta
        title="Know what people search. Now check if they find you."
        body="The free Growlocal audit checks whether your website and Google profile are ready to rank for searches like these, and in AI answers."
      />
    </div>
  );
}
