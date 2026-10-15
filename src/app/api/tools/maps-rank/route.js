import { toolHandler } from "@/lib/tool-route";
import { mapsRank } from "@/lib/maps-rank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Each check is four paid Places Text Search calls (locate the area, then
// three searches), so it also has a daily cap.
export const POST = toolHandler({
  bucket: "maps-rank",
  perIp: { limit: 6, windowSeconds: 600 },
  dailyCap: 150,
  validate: (b, text) => {
    const business = text(b.business, 120);
    const keyword = text(b.keyword, 60);
    const area = text(b.area, 80);
    if (!business || !keyword || !area) return "Fill in your business, the search, and the area.";
    return { business, keyword, area };
  },
  run: (input) => mapsRank(input),
});
