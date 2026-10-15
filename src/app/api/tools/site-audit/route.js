import { toolHandler } from "@/lib/tool-route";
import { crawlSite } from "@/lib/site-crawl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = toolHandler({
  bucket: "site-audit",
  perIp: { limit: 5, windowSeconds: 600 },
  validate: (b, text) => {
    const url = text(b.url, 2048);
    return url ? { url } : "Enter your website address.";
  },
  run: ({ url }) => crawlSite(url),
});
