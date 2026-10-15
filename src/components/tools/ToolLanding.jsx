// Server-rendered shell for a free tool page: structured data, H1 with a
// definitional opening line, the tool itself, a how-it-works section with
// internal links, and the FAQ (visible text and FAQPage schema share items).
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { JsonLd, webPageSchema, breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { FaqSection } from "@/components/FaqSection";

export function toolMetadata({ path, title, description }) {
  return {
    title,
    description,
    alternates: { canonical: `${BRAND.url}${path}` },
    openGraph: {
      type: "website",
      title: `${title} · ${BRAND.name}`,
      description,
      url: `${BRAND.url}${path}`,
      images: [{ url: `${BRAND.url}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
  };
}

const linkClass = "text-indigo-700 underline underline-offset-2";

export function ToolLanding({ path, title, description, crumb, h1, intro, howToName, steps, related, faq, children }) {
  const app = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    url: `${BRAND.url}${path}`,
    description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    provider: { "@type": "Organization", name: BRAND.name, url: BRAND.url },
  };
  return (
    <>
      <JsonLd data={app} />
      <JsonLd data={webPageSchema({ path, title, description })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }, { name: crumb, path }])} />
      <JsonLd data={howToSchema({ name: howToName, description, steps })} />
      <JsonLd data={faqSchema(faq)} />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-12">
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link href="/tools" className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-forest-900/70 hover:text-forest-900">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All free tools
          </Link>
        </nav>
        <h1 className="font-display text-[2.1rem] sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-4 text-balance">{h1}</h1>
        <p className="text-lg text-forest-900/70 leading-relaxed mb-8 text-pretty">{intro}</p>
        {children}
      </div>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-12 border-t hairline">
        <h2 className="font-display text-3xl tracking-[-0.03em] mb-6">How does it work?</h2>
        <ol className="space-y-5">
          {steps.map((s, i) => (
            <li key={s.name} className="flex gap-4">
              <span className="w-8 h-8 rounded-full border-2 border-indigo-600 text-indigo-700 text-sm font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
              <div>
                <h3 className="font-medium mb-1">{s.name}</h3>
                <p className="text-forest-900/70 leading-relaxed">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-forest-900/70 leading-relaxed">
          Related free tools:{" "}
          {related.map((r, i) => (
            <span key={r.href}>
              <Link href={r.href} className={linkClass}>{r.label}</Link>
              {i < related.length - 1 ? ", " : "."}
            </span>
          ))}{" "}
          Or read <Link href="/what-is-geo" className={linkClass}>what GEO means for local search</Link>.
        </p>
      </section>

      <FaqSection items={faq} />
    </>
  );
}
