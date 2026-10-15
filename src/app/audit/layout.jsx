import { BRAND } from "@/lib/brand";
import { JsonLd, webPageSchema, breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { AUDIT_FAQ, AUDIT_STEPS } from "@/lib/page-faq";

// The audit page itself is a client component, so its metadata and structured
// data live here, in a server layout, and ship in the served HTML.
const TITLE = "Free SEO, AEO and GEO audit";
const DESCRIPTION =
  "Paste your website or Google Maps link and get SEO, AEO and GEO scores out of 100, with the exact fix for every gap. Free, no signup.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BRAND.url}/audit` },
};

export default function AuditLayout({ children }) {
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/audit", title: TITLE, description: DESCRIPTION })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Free audit", path: "/audit" }])} />
      <JsonLd data={faqSchema(AUDIT_FAQ)} />
      <JsonLd data={howToSchema({
        name: "How the Growlocal audit works",
        description: "From pasting your site to a scored list of fixes.",
        steps: AUDIT_STEPS,
      })} />
      {children}
    </>
  );
}
