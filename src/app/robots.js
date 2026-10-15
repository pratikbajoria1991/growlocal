import { BRAND } from "@/lib/brand";

export default function robots() {
  return {
    rules: [
      // /preview/ holds sites built for businesses that haven't claimed them yet —
      // they must never be crawled or compete with the real listing.
      { userAgent: "*", allow: "/", disallow: ["/api/", "/app", "/p/", "/preview/"] },
      // Growlocal is an AEO tool — we practise what we sell. AI crawlers welcome.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
    ],
    sitemap: `${BRAND.url}/sitemap.xml`,
  };
}
