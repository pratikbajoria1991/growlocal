import { toolHandler } from "@/lib/tool-route";
import { pageSpeed } from "@/lib/page-speed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = toolHandler({
  bucket: "page-speed",
  perIp: { limit: 6, windowSeconds: 600 },
  dailyCap: 2000,
  validate: (b, text) => {
    const url = text(b.url, 2048);
    if (!url) return "Enter a page address.";
    return { url, strategy: b.strategy === "desktop" ? "desktop" : "mobile" };
  },
  run: ({ url, strategy }) => pageSpeed(url, strategy),
});
