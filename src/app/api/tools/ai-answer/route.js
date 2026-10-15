import { toolHandler } from "@/lib/tool-route";
import { aiAnswerCheck, aiAnswerConfigured } from "@/lib/ai-answer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Grounded Gemini calls are paid beyond the free tier, so this is capped too.
export const POST = toolHandler({
  bucket: "ai-answer",
  perIp: { limit: 4, windowSeconds: 600 },
  dailyCap: 300,
  validate: (b, text) => {
    const business = text(b.business, 120);
    const keyword = text(b.keyword, 60);
    const area = text(b.area, 80);
    if (!business || !keyword || !area) return "Fill in your business, the service, and the area.";
    return { business, keyword, area };
  },
  run: async (input) => {
    if (!aiAnswerConfigured()) {
      const e = new Error("The AI answer check isn't switched on yet.");
      e.code = "not_configured";
      throw e;
    }
    return aiAnswerCheck(input);
  },
});
