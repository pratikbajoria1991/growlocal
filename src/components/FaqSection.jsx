// Visible FAQ block, same markup as the homepage FAQ (details/summary with an
// h3 question). Pair it with <JsonLd data={faqSchema(items)} /> using the same
// items so the page text and the structured data stay identical.
export function FaqSection({ items, heading = "Frequently asked questions", className = "max-w-3xl mx-auto px-5 sm:px-8 py-16 border-t hairline" }) {
  return (
    <section className={className}>
      <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-10 text-balance">
        {heading}
      </h2>
      <div className="divide-y divide-forest-900/[0.07]">
        {items.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
              <h3 className="font-display text-lg sm:text-xl leading-snug">{f.q}</h3>
              <span className="mt-1 shrink-0 w-5 h-5 rounded-full border hairline flex items-center justify-center text-forest-900/65 group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-forest-900/70 leading-relaxed text-pretty">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
