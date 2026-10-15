import { ToolLanding, toolMetadata } from "@/components/tools/ToolLanding";
import { SiteAuditTool } from "@/components/tools/SiteAuditTool";

const PATH = "/tools/site-audit";
const TITLE = "Free Website SEO Audit & Site Crawler";
const DESCRIPTION = "Free site audit that crawls up to 25 pages and finds broken links, missing titles, duplicate content and thin pages. Like Semrush Site Audit. No signup.";

export const metadata = toolMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const STEPS = [
  { name: "Enter your website", text: "Type your homepage address. We read your robots.txt and sitemap to find your pages." },
  { name: "We crawl up to 25 pages", text: "Each page is checked for errors, titles, descriptions, headings, image alt text, word count and links." },
  { name: "Fix the top of the list", text: "Issues are sorted by impact. Fix the high-priority ones first, then run the audit again." },
];

const FAQ = [
  { q: "What does a site audit check?", a: "It checks every crawled page for errors (4xx and 5xx), broken internal links, redirect chains, missing or duplicate titles and descriptions, missing H1s, heading order, image alt text, thin content and noindex tags." },
  { q: "Is this like the Semrush or Ahrefs site audit?", a: "It runs the same kind of checks, on up to 25 pages and for free. Paid tools crawl thousands of pages and track changes over time." },
  { q: "Why does my site have broken links?", a: "Usually a page was renamed or deleted, or a link was typed wrong, like a phone number added as a link without tel:. The audit lists the page each broken link is on." },
  { q: "How many pages does the free audit crawl?", a: "Up to 25, starting from your homepage and sitemap. For most local business websites that covers every page." },
  { q: "Does it change anything on my website?", a: "No. It only reads your public pages, the same way Google does." },
  { q: "Is it free and do I need to sign up?", a: "It is free and needs no signup or email." },
];

export default function Page() {
  return (
    <ToolLanding
      path={PATH}
      title={TITLE}
      description={DESCRIPTION}
      crumb="Site audit"
      h1="Free website SEO audit and site crawler"
      intro="A site audit is a crawl of your website that finds the technical problems stopping pages from ranking. Enter your site and we check up to 25 pages for broken links, missing titles, duplicate content and more."
      howToName="How to audit a website for SEO issues"
      steps={STEPS}
      related={[{ href: "/tools/page-speed", label: "Page speed test" }, { href: "/tools/backlink-finder", label: "Backlink & citation finder" }, { href: "/tools/ai-visibility", label: "AI crawler check" }]}
      faq={FAQ}
    >
      <SiteAuditTool />
    </ToolLanding>
  );
}
