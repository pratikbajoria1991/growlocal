"use client";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { fieldClass, useToolRun, Field, ToolForm, ScoreHero, Limits, ProductCta } from "./kit";

export function AiAnswerTool() {
  const [business, setBusiness] = useState("");
  const [keyword, setKeyword] = useState("");
  const [area, setArea] = useState("");
  const { loading, res, error, run } = useToolRun("/api/tools/ai-answer");
  const ready = business.trim() && keyword.trim() && area.trim();

  return (
    <div>
      <ToolForm
        label="Check if AI recommends you"
        onSubmit={() => run({ business: business.trim(), keyword: keyword.trim(), area: area.trim() })}
        loading={loading}
        disabled={!ready}
        button="Ask the AI"
        busy="Asking Google's Gemini"
        note="Free, no signup. Takes about 10 seconds."
        error={error}
      >
        <Field id="aa-biz" label="Your business name">
          <input id="aa-biz" className={fieldClass} value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="As customers know it" autoComplete="organization" required />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field id="aa-kw" label="Your service">
            <input id="aa-kw" className={fieldClass} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="dentist" required />
          </Field>
          <Field id="aa-area" label="Area">
            <input id="aa-area" className={fieldClass} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Salt Lake, Kolkata" required />
          </Field>
        </div>
      </ToolForm>

      <div aria-live="polite">{res && <Results res={res} business={business} />}</div>
    </div>
  );
}

function Results({ res, business }) {
  return (
    <div className="mt-8 space-y-8">
      <ScoreHero
        eyebrow={`"${res.question}"`}
        headline={res.mentioned ? `Yes. The AI named ${business}.` : `No. The AI didn't name ${business}.`}
        body={
          res.mentioned
            ? "AI assistants already know you for this search. Keep your profiles and reviews current so it stays that way."
            : "When customers ask an AI assistant this question, they get other names. The sources below are where the answer came from."
        }
      />

      <section>
        <h2 className="font-display text-2xl mb-3">The full AI answer</h2>
        <div className="rounded-2xl border hairline bg-white p-4 sm:p-5 text-forest-900/85 leading-relaxed whitespace-pre-line text-[15px]">
          {res.answer.replace(/\*\*/g, "")}
        </div>
      </section>

      {res.sources.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-1">Where the AI got its answer</h2>
          <p className="text-forest-900/70 mb-3">Being listed and well reviewed on these sites is how you get into the answer.</p>
          <ul className="space-y-2">
            {res.sources.map((s) => (
              <li key={s.title}>
                {s.uri ? (
                  <a href={s.uri} target="_blank" rel="noopener noreferrer" className="min-h-[44px] inline-flex items-center gap-1.5 text-indigo-700 hover:underline">
                    {s.title} <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  <span>{s.title}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Limits>
        this is one answer from one AI ({res.model}{res.grounded ? ", with Google Search" : ""}). AI answers change between runs, and
        ChatGPT or Perplexity may answer differently.
      </Limits>

      <ProductCta
        title="Get named when customers ask AI"
        body="The free Growlocal audit scores how ready your website is to be quoted by AI assistants, and lists what to fix first."
      />
    </div>
  );
}
