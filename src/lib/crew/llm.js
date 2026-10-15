// One agent = one bounded tool-use loop on Claude. Returns validated JSON.
//
// - Manual loop on purpose: every tool call is logged to the run trace and
//   the token budget is enforced between turns, which a library loop hides.
// - Model: claude-opus-5-5 (CREW_MODEL overrides). Thinking can't be disabled
//   on this model, so depth is set with output_config.effort instead.
// - Forced tool_choice isn't supported on this model, so the final answer is
//   requested as schema-constrained JSON (output_config.format) while tools
//   stay available — the loop ends when the model stops calling tools.
// - Refusal fallbacks are requested server-side by default (Claude API only);
//   if the API rejects the beta, the request is retried once without it.

import Anthropic from "@anthropic-ai/sdk";

export const MODEL = () => process.env.CREW_MODEL || "claude-opus-5-5";
export const llmConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

let client;
const getClient = () => (client ||= new Anthropic());

// Minimal input validation — enough to reject malformed/truncated tool input
// before it reaches a tool. (The model's tool input is untrusted.)
function validateInput(schema, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "input must be an object";
  for (const k of schema?.required || []) if (!(k in input)) return `missing required field "${k}"`;
  for (const [k, def] of Object.entries(schema?.properties || {})) {
    if (!(k in input)) continue;
    const t = def.type, v = input[k];
    if (t === "string" && typeof v !== "string") return `"${k}" must be a string`;
    if (t === "number" && typeof v !== "number") return `"${k}" must be a number`;
    if (t === "array" && !Array.isArray(v)) return `"${k}" must be an array`;
  }
  return null;
}

/**
 * @param {object} spec
 * @param {string} spec.name           agent name (for the trace)
 * @param {string} spec.system         role + rules
 * @param {string} spec.prompt         the task
 * @param {{name:string,description:string,input_schema:object,run:Function}[]} [spec.tools]
 * @param {object} spec.schema         JSON Schema for the final answer
 * @param {"low"|"medium"|"high"|"xhigh"|"max"} [spec.effort]
 * @param {number} [spec.maxTurns]
 * @param {{tokens:number, used:number}} [spec.budget] shared across agents in a run
 * @param {(e:object)=>void} [spec.onEvent]
 * @param {Function} [spec.llm]        test seam: replaces the API call entirely
 */
export async function runAgent(spec) {
  const { name, system, prompt, tools = [], schema, effort = "medium", maxTurns = 8, budget, onEvent = () => {} } = spec;

  if (spec.llm) { // scripted model for tests — same contract as the real loop
    const r = await spec.llm({ name, system, prompt, tools, schema });
    onEvent({ agent: name, type: "scripted" });
    return { data: r, turns: 1, tokens: 0 };
  }
  if (!llmConfigured()) throw Object.assign(new Error("ANTHROPIC_API_KEY is not set — the crew can't call Claude."), { code: "not_configured" });

  const toolDefs = tools.map(({ name: n, description, input_schema }) => ({ name: n, description, input_schema }));
  const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
  const messages = [{ role: "user", content: prompt }];
  let tokens = 0, useFallbacks = process.env.CREW_FALLBACKS !== "off";

  for (let turn = 1; turn <= maxTurns; turn++) {
    if (budget && budget.used >= budget.tokens) throw Object.assign(new Error(`Run token budget (${budget.tokens}) reached.`), { code: "budget" });

    const params = {
      model: MODEL(),
      max_tokens: 16000,
      system,
      messages,
      ...(toolDefs.length ? { tools: toolDefs } : {}),
      output_config: { effort, format: { type: "json_schema", schema } },
    };

    let message;
    try {
      const stream = useFallbacks
        ? getClient().beta.messages.stream({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
        : getClient().messages.stream(params);
      message = await stream.finalMessage();
    } catch (err) {
      // Beta/fallback parameter rejected -> retry this turn once without it.
      if (useFallbacks && err instanceof Anthropic.BadRequestError && /fallback|beta/i.test(err.message)) { useFallbacks = false; turn--; continue; }
      if (err instanceof Anthropic.RateLimitError) { await new Promise((r) => setTimeout(r, 4000)); turn--; continue; }
      throw err;
    }

    const used = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);
    tokens += used; if (budget) budget.used += used;

    if (message.stop_reason === "refusal") throw Object.assign(new Error(`${name}: request declined by safety classifiers (${message.stop_details?.category || "unspecified"}).`), { code: "refusal" });
    if (message.stop_reason === "max_tokens") throw Object.assign(new Error(`${name}: output truncated at max_tokens.`), { code: "truncated" });

    const toolUses = message.content.filter((b) => b.type === "tool_use");
    if (message.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: message.content }); continue; }

    if (!toolUses.length) {
      const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      let data; try { data = JSON.parse(text); } catch { throw Object.assign(new Error(`${name}: final answer was not valid JSON.`), { code: "bad_json" }); }
      onEvent({ agent: name, type: "done", turns: turn, tokens });
      return { data, turns: turn, tokens };
    }

    messages.push({ role: "assistant", content: message.content });
    const results = await Promise.all(toolUses.map(async (tu) => {
      const tool = byName[tu.name];
      const bad = !tool ? `unknown tool "${tu.name}"` : validateInput(tool.input_schema, tu.input);
      if (bad) return { type: "tool_result", tool_use_id: tu.id, is_error: true, content: bad };
      onEvent({ agent: name, type: "tool", tool: tu.name });
      try {
        const out = await tool.run(tu.input);
        const s = typeof out === "string" ? out : JSON.stringify(out);
        return { type: "tool_result", tool_use_id: tu.id, content: s.length > 24000 ? s.slice(0, 24000) + "\n…[truncated]" : s };
      } catch (e) {
        return { type: "tool_result", tool_use_id: tu.id, is_error: true, content: String(e.message || e).slice(0, 500) };
      }
    }));
    messages.push({ role: "user", content: results }); // all results in ONE user message
  }
  throw Object.assign(new Error(`${name}: no final answer within ${maxTurns} turns.`), { code: "max_turns" });
}
