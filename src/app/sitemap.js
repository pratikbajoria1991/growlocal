import { BRAND } from "@/lib/brand";

export default function sitemap() {
  const now = new Date().toISOString();
  const pages = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/audit", priority: 0.95, changeFrequency: "weekly" },
    { path: "/autopilot", priority: 0.9, changeFrequency: "monthly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
    { path: "/what-is-aeo", priority: 0.8, changeFrequency: "monthly" },
    { path: "/what-is-geo", priority: 0.8, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];
  return pages.map((p) => ({
    url: `${BRAND.url}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
