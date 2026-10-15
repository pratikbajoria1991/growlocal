// Read-only tools the agents can call. None of them writes anywhere: the crew
// proposes, the dispatcher records, and risky changes wait for the owner.

import { runAuditOnHtml } from "../audit";
import { applyEdits, EDIT_OPS } from "./patch";
import { checkText } from "./guard";

const strip = (h) => String(h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const grab = (re, html) => [...html.matchAll(re)].map((m) => strip(m[1])).filter(Boolean);

export function summarizePage(html) {
  return {
    title: grab(/<title[^>]*>([\s\S]*?)<\/title>/gi, html)[0] || null,
    metaDescription: html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || null,
    canonical: html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)?.[1] || null,
    h1: grab(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, html),
    headings: grab(/<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/gi, html).slice(0, 25),
    jsonLdTypes: [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]).slice(0, 20),
    textSample: strip(html).slice(0, 3500),
    htmlLength: html.length,
  };
}

const scores = (a) => ({ overall: a.overall, SEO: a.scores.SEO.score, AEO: a.scores.AEO.score, GEO: a.scores.GEO.score });
const failing = (a, cats) => ["SEO", "AEO", "GEO"].filter((c) => !cats || cats.includes(c)).flatMap((c) =>
  a.scores[c].checks.filter((x) => !x.pass).map((x) => ({ category: c, id: x.id, label: x.label, lost: x.max - x.points, fix: x.fix })))
  .sort((a, b) => b.lost - a.lost);

export const editSchema = {
  type: "object", additionalProperties: false, required: ["edits"],
  properties: { edits: { type: "array", items: { type: "object", additionalProperties: false, required: ["op", "value", "html", "rationale", "issue_ids"], properties: {
    op: { type: "string", enum: EDIT_OPS }, value: { type: "string" }, html: { type: "string" }, rationale: { type: "string" }, issue_ids: { type: "array", items: { type: "string" } } } } } },
};

/** @param {{facts:object, html:string|null, siteUrl:string|null, comp:object|null, ownerFacts:string}} ctx */
export function makeTools(ctx) {
  const origin = ctx.siteUrl ? new URL(ctx.siteUrl).origin : undefined;
  const tools = [
    {
      name: "get_facts",
      description: "The verified fact sheet for this business (live Google listing + owner-supplied facts). Everything you write must trace to this. If you need a detail that isn't here, write <FILL: what's needed> instead of inventing it.",
      input_schema: { type: "object", properties: {}, required: [] },
      run: async () => ({ facts: ctx.facts, ownerSupplied: ctx.ownerFacts || "(none)" }),
    },
    {
      name: "get_competitors",
      description: "Measured comparison with the nearest competitors: review counts, ratings, website presence, common Google categories.",
      input_schema: { type: "object", properties: {}, required: [] },
      run: async () => ctx.comp || { note: "no competitor data" },
    },
    {
      name: "check_text",
      description: "Run the deterministic guardrail on a draft (banned claims, unsupported figures/prices, wrong phone). Fix anything it reports before submitting.",
      input_schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
      run: async ({ text }) => checkText(text, ctx.facts, ctx.ownerFacts),
    },
  ];
  if (ctx.html) tools.push(
    {
      name: "get_page",
      description: "Current structure of the website homepage: title, meta description, canonical, headings, schema types present, a text sample.",
      input_schema: { type: "object", properties: {}, required: [] },
      run: async () => summarizePage(ctx.html),
    },
    {
      name: "score_page_with_edits",
      description: "Apply your proposed edits to a COPY of the page and re-run Growlocal's real SEO/AEO/GEO audit. Returns before/after scores, edits that were rejected (and why), and the checks still failing. Use it to verify a fix actually moves the score before you submit.",
      input_schema: { type: "object", properties: { edits: editSchema.properties.edits }, required: ["edits"] },
      run: async ({ edits }) => {
        const before = await runAuditOnHtml(ctx.html, ctx.siteUrl || "");
        const patched = applyEdits(ctx.html, edits, { origin });
        const after = await runAuditOnHtml(patched.html, ctx.siteUrl || "");
        return { before: scores(before), after: scores(after), rejected: patched.rejected, stillFailing: failing(after).slice(0, 8) };
      },
    },
    {
      name: "list_failing_checks",
      description: "The audit checks currently failing on the page, with the points each would recover and the audit's own fix text. Optionally filter to categories SEO / AEO / GEO.",
      input_schema: { type: "object", properties: { categories: { type: "array", items: { type: "string", enum: ["SEO", "AEO", "GEO"] } } }, required: [] },
      run: async ({ categories }) => failing(await runAuditOnHtml(ctx.html, ctx.siteUrl || ""), categories).slice(0, 14),
    },
  );
  return tools;
}

export { scores, failing };
