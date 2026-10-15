import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { JsonLd, webPageSchema, breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { FaqSection } from "@/components/FaqSection";
import { BacklinkFinder } from "@/components/tools/BacklinkFinder";

const PATH = "/tools/backlink-finder";
const TITLE = "Free Local Backlink & Citation Finder";
const DESCRIPTION = "Free backlink and citation finder for local businesses. See which profiles your site links to, what competitors have, and links you can win. No signup.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BRAND.url}${PATH}` },
  openGraph: {
    type: "website",
    title: `${TITLE} · ${BRAND.name}`,
    description: DESCRIPTION,
    url: `${BRAND.url}${PATH}`,
    images: [{ url: `${BRAND.url}/opengraph-image`, width: 1200, height: 630, alt: TITLE }],
  },
};

const STEPS = [
  { name: "Enter your website", text: "Type your website address and pick your type of business. Adding a competitor's website is optional." },
  { name: "See which profiles you link to", text: "We read your homepage and schema markup and list the directories and profiles that matter for your business, linked or not." },
  { name: "Claim, link and ask", text: "Check each missing listing, create it if needed, link it from your site, then use the mention searches to ask sites that already name you for a link." },
];

const FAQ = [
  { q: "What is a backlink finder?", a: "A backlink finder shows where your business could earn links from other websites. This one checks the directories and profiles relevant to your business and finds sites that already mention you." },
  { q: "Is this a backlink checker like Ahrefs or Semrush?", a: "No. Ahrefs and Semrush crawl billions of pages to count who links to you. This free tool checks your own site and the profiles that matter locally, and says plainly what it can't see." },
  { q: "Does it build or generate backlinks for me?", a: "No. Automatically generating backlinks breaks Google's spam policies and can get a site penalised. The tool shows honest opportunities: profiles to claim and sites that already mention you." },
  { q: "What is a local citation?", a: "A citation is a listing of your business name, address and phone on another site, such as Justdial or Practo. Consistent citations help Google and AI assistants trust your details." },
  { q: "Why should my website link to my own profiles?", a: "Linking your Google profile and directory listings from your site confirms they belong to you. Search engines and AI assistants use these links to connect your business details." },
  { q: "Is the tool free and do I need to sign up?", a: "It is free and needs no signup or email. Results come back in about ten seconds." },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: TITLE,
  url: `${BRAND.url}${PATH}`,
  description: DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  provider: { "@type": "Organization", name: BRAND.name, url: BRAND.url },
};

export default function BacklinkFinderPage() {
  return (
    <>
      <JsonLd data={appSchema} />
      <JsonLd data={webPageSchema({ path: PATH, title: TITLE, description: DESCRIPTION })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }, { name: "Backlink finder", path: PATH }])} />
      <JsonLd data={howToSchema({ name: "How to find backlink and citation opportunities for a local business", description: DESCRIPTION, steps: STEPS })} />
      <JsonLd data={faqSchema(FAQ)} />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-12">
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link href="/tools" className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-forest-900/70 hover:text-forest-900">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All free tools
          </Link>
        </nav>

        <h1 className="font-display text-[2.1rem] sm:text-5xl leading-[1.05] tracking-[-0.035em] mb-4 text-balance">
          Free local backlink and citation finder
        </h1>
        <p className="text-lg text-forest-900/70 leading-relaxed mb-8 text-pretty">
          A backlink finder is a tool that shows where your business could earn links from other websites. Enter your site and see which
          directories and profiles you link to, what a competitor has that you don&apos;t, and sites that already mention you.
        </p>

        <BacklinkFinder />
      </div>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-12 border-t hairline">
        <h2 className="font-display text-3xl tracking-[-0.03em] mb-6">How does the backlink finder work?</h2>
        <ol className="space-y-5">
          {STEPS.map((s, i) => (
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
          Links are one part of local visibility. Your website also needs the right{" "}
          <Link href="/tools/schema-generator" className="text-indigo-700 underline underline-offset-2">schema markup</Link>, access for{" "}
          <Link href="/tools/ai-visibility" className="text-indigo-700 underline underline-offset-2">AI crawlers</Link>, and a complete Google profile. Read{" "}
          <Link href="/blog/local-business-not-showing-up-near-me-searches" className="text-indigo-700 underline underline-offset-2">why businesses miss &quot;near me&quot; searches</Link>{" "}
          or what <Link href="/what-is-geo" className="text-indigo-700 underline underline-offset-2">GEO</Link> means for local search.
        </p>
      </section>

      <FaqSection items={FAQ} />
    </>
  );
}
