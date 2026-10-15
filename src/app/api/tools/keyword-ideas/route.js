import { toolHandler } from "@/lib/tool-route";
import { keywordIdeas } from "@/lib/keyword-ideas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const POST = toolHandler({
  bucket: "keyword-ideas",
  perIp: { limit: 10, windowSeconds: 600 },
  validate: (b, text) => {
    const seed = text(b.seed, 60);
    if (seed.length < 2) return "Enter a keyword, like \"dentist\".";
    return { seed, area: text(b.area, 60) };
  },
  run: (input) => keywordIdeas(input),
});
