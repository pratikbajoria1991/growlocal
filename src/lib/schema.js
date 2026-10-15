// Structured data for Growlocal itself.
//
// An AEO tool that ships without schema has no business selling schema advice.
// Every builder here maps to a check in src/lib/audit.js — we score ourselves
// with the same rubric we sell.

import { BRAND, ORG, PLANS, PROPOSAL_TIERS } from "./brand";

const ORG_ID = `${BRAND.url}/#organization`;
const SITE_ID = `${BRAND.url}/#website`;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: BRAND.name,
    url: BRAND.url,
    logo: { "@type": "ImageObject", url: `${BRAND.url}/icon.png`, width: 512, height: 512 },
    image: `${BRAND.url}/opengraph-image`,
    description: BRAND.pitch,
    email: BRAND.email,
    priceRange: "₹₹",
    areaServed: ORG.areaServed.map((name) => ({ "@type": "AdministrativeArea", name })),
    founder: { "@type": "Person", name: ORG.founder },
    sameAs: ORG.sameAs,
    knowsAbout: [
      "Answer Engine Optimization",
      "Generative Engine Optimization",
      "Search Engine Optimization",
      "Google Business Profile optimization",
      "Local SEO",
      "Structured data and schema markup",
    ],
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    url: BRAND.url,
    name: BRAND.name,
    description: BRAND.pitch,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BRAND.url}/audit?url={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function webPageSchema({ path, title, description, datePublished, dateModified }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BRAND.url}${path}#webpage`,
    url: `${BRAND.url}${path}`,
    name: title,
    description,
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en",
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: { "@type": "Organization", "@id": ORG_ID, name: BRAND.name },
    publisher: { "@id": ORG_ID },
  };
}

export function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbSchema(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${BRAND.url}${t.path}`,
    })),
  };
}

export function howToSchema({ name, description, steps, totalTime }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function articleSchema({ slug, title, description, datePublished, dateModified, tags, wordCount }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${BRAND.url}/blog/${slug}#article`,
    headline: title,
    description,
    url: `${BRAND.url}/blog/${slug}`,
    datePublished,
    dateModified: dateModified || datePublished,
    ...(wordCount ? { wordCount } : {}),
    keywords: (tags || []).join(", "),
    author: { "@type": "Person", name: ORG.founder, url: BRAND.url },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BRAND.url}/blog/${slug}` },
    isAccessibleForFree: true,
    inLanguage: "en",
  };
}

// Growlocal is sold as a service that does the work, not an app you operate —
// so it's described as a Service with the business owner as the audience.
// Offers come straight from PLANS so the markup can't drift from the page.
export function serviceSchema() {
  const managed = PLANS.find((p) => p.id === "managed");
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BRAND.url}/#service`,
    name: `${BRAND.name} — done-for-you local marketing`,
    serviceType: "Local marketing management",
    description: BRAND.pitch,
    url: `${BRAND.url}/managed`,
    provider: { "@id": ORG_ID },
    areaServed: ORG.areaServed.map((name) => ({ "@type": "AdministrativeArea", name })),
    audience: { "@type": "BusinessAudience", audienceType: "Local business owners" },
    offers: [
      {
        "@type": "Offer",
        name: "Free visibility audit",
        price: "0",
        priceCurrency: "INR",
        description: "Unlimited SEO, AEO and GEO website audits",
      },
      ...PROPOSAL_TIERS.map((t) => ({
        "@type": "Offer",
        name: `${managed.name} — ${t.name}`,
        price: String(t.priceNumeric),
        priceCurrency: "INR",
        description: t.pitch,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(t.priceNumeric),
          priceCurrency: "INR",
          unitText: "per location, per month",
        },
      })),
    ],
  };
}

// Renders one JSON-LD block. Next injects this into the streamed HTML, so the
// markup is present for crawlers that don't execute JavaScript.
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
