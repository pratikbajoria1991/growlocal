import { BRAND } from "@/lib/brand";

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/app"] },
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
