import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "What is AEO (Answer Engine Optimization)?",
  description:
    "AEO is the practice of structuring your content so AI answer engines — ChatGPT, Perplexity, Claude, Google AI Overviews — cite your business as the answer. Here's what it means and how to start.",
};

const FAQ = [
  {
    q: "What is Answer Engine Optimization?",
    a: "Answer Engine Optimization (AEO) is the practice of structuring your website content so that AI answer engines — ChatGPT, Perplexity, Claude, and Google's AI Overviews — can extract and cite it when answering a user's question. Where SEO competes for a ranking position, AEO competes to be the source the AI quotes.",
  },
  {
    q: "How is AEO different from SEO?",
    a: "SEO optimises for a ranking position on a results page. AEO optimises for citation inside a generated answer. SEO rewards depth and keywords; AEO rewards structure, direct answers, and machine-readable schema. They overlap — AI systems lean on Google's index — but the tactics differ.",
  },
  {
    q: "Does AEO replace SEO?",
    a: "No. AI answer engines still draw heavily on traditional search rankings to decide which sources to trust. AEO is a layer on top of solid SEO, not a replacement for it.",
  },
  {
    q: "What is the single biggest AEO win?",
    a: "Adding a genuine FAQ section with FAQPage JSON-LD schema. AI systems lift FAQ answers almost verbatim because they are already formatted as question-and-answer pairs — exactly the shape a generated answer needs.",
  },
  {
    q: "How do I know if my site is AEO-ready?",
    a: "Run a free audit at growlocal — it scores your page out of 100 on AEO specifically, checking FAQ schema, question-format headings, direct answer patterns, author metadata, and extractable paragraph length.",
  },
];

export default function WhatIsAEO() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <article className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">Guide</div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          What is Answer Engine Optimization?
        </h1>

        <p className="text-xl text-forest-900/70 leading-relaxed mb-10">
          Answer Engine Optimization (AEO) is the practice of structuring your content so AI answer engines cite your business as the answer to a user&apos;s question.
        </p>

        <div className="space-y-9 text-forest-900/80 leading-relaxed">
          {FAQ.map((f) => (
            <section key={f.q}>
              <h2 className="font-display text-2xl mb-3">{f.q}</h2>
              <p className="text-[15px]">{f.a}</p>
            </section>
          ))}

          <section>
            <h2 className="font-display text-2xl mb-3">The five fixes that move AEO scores most</h2>
            <ol className="list-decimal pl-5 space-y-2.5 text-[15px]">
              <li><strong>Add FAQPage schema.</strong> 15-25 real customer questions with JSON-LD markup. Highest-leverage change available.</li>
              <li><strong>Rewrite headings as questions.</strong> &quot;What does it cost?&quot; beats &quot;Pricing&quot; — AI matches user queries against heading text.</li>
              <li><strong>Open with a definition.</strong> Start with &quot;X is Y.&quot; AI systems preferentially quote that construction.</li>
              <li><strong>Keep paragraphs extractable.</strong> 40-320 characters. A wall of text gets skipped for a competitor&apos;s tight paragraph.</li>
              <li><strong>Attribute your content.</strong> Author metadata feeds E-E-A-T signals, which AI systems weight heavily.</li>
            </ol>
          </section>
        </div>

        <div className="mt-12 rounded-4xl bg-forest-900 text-canvas-50 p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 70% at 90% 0%, rgba(126,226,62,0.35), transparent 70%)" }} />
          <div className="relative">
            <h2 className="font-display text-2xl mb-3">Score your site&apos;s AEO in seconds</h2>
            <p className="text-canvas-50/70 mb-6 leading-relaxed max-w-md">Free, no signup. You&apos;ll get an AEO score out of 100 plus the exact fix for every gap.</p>
            <Link href="/audit" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-lime-500 text-forest-900 font-semibold text-sm hover:bg-lime-400 transition-colors">
              Run free audit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
