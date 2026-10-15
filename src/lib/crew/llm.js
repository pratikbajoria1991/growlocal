// One agent = one bounded tool-use loop on a model. Returns validated JSON.
//
// Providers (CREW_PROVIDER picks one; otherwise the first configured wins,
// in this order):
//   gemini     GEMINI_API_KEY        model CREW_MODEL || GEMINI_MODEL || gemini-3.8-flash
//   ollama     OLLAMA_API_KEY and/or OLLAMA_HOST (local http://localhost:11434,
//              or Ollama Cloud https://ollama.com with a key)  model CREW_MODEL || OLLAMA_MODEL
//   anthropic  ANTHROPIC_API_KEY     model CREW_MODEL || claude-opus-5-5
//
// - Manual loop on purpose: every tool call is logged to the run trace and
//   the token budget is enforced between turns, which a library loop hides.
// - The final answer is schema-constrained JSON. Where a provider can't
//   combine tools with a response schema, the loop runs with tools and one
//   last call (no tools) formats the answer against the schema.
// - Model tool input is untrusted: it is validated before any tool runs.

const PROVIDERS = ["gemini", "ollama", "anthropic"];

function configured(p) {
  if (p === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  if (p === "ollama") return Boolean(process.env.OLLAMA_API_KEY || process.env.OLLAMA_HOST);
  if (p === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  return false;
}

export function provider() {
  return providerChain()[0] || null;
}

// The chosen provider first (CREW_PROVIDER), then every other configured one
// as a fallback, so a provider outage or exhausted quota doesn't fail a run.
export function providerChain() {
  const want = (process.env.CREW_PROVIDER || "").toLowerCase();
  const rest = PROVIDERS.filter((p) => p !== want && configured(p));
  return PROVIDERS.includes(want) && configured(want) ? [want, ...rest] : rest;
}

// Model per provider (CREW_MODEL applies to the primary only).
function modelFor(p, primary) {
  if (primary && process.env.CREW_MODEL) return process.env.CREW_MODEL;
  if (p === "gemini") return process.env.GEMINI_MODEL || "gemini-3.8-flash";
  if (p === "ollama") return process.env.OLLAMA_MODEL || "gpt-oss:120b";
  return "claude-opus-5-5";
}


export const llmConfigured = () => Boolean(provider());

export const MODEL = () => (provider() ? modelFor(provider(), true) : null);

// Minimal input validation — enough to reject malformed/truncated tool input
// before it reaches a tool.
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

// Checks a final answer against its JSON Schema (the subset the crew uses:
// type, required, enum, properties, items). Returns a list of problems.
export function schemaErrors(schema, value, path = "$") {
  if (!schema) return [];
  const errs = [];
  const t = schema.type;
  const typeOk = t === "array" ? Array.isArray(value) : t === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : t === "number" ? typeof value === "number" : t === "integer" ? Number.isInteger(value) : t === "string" ? typeof value === "string" : t === "boolean" ? typeof value === "boolean" : true;
  if (!typeOk) return [`${path} should be ${t}`];
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${path} must be one of ${schema.enum.join(", ")}`);
  if (t === "object") {
    for (const k of schema.required || []) if (!(k in value)) errs.push(`${path}.${k} is missing`);
    for (const [k, sub] of Object.entries(schema.properties || {})) if (k in value) errs.push(...schemaErrors(sub, value[k], `${path}.${k}`));
  }
  if (t === "array" && schema.items) value.forEach((v, i) => errs.push(...schemaErrors(schema.items, v, `${path}[${i}]`)));
  return errs.slice(0, 12);
}

async function runTool(byName, name, input, onEvent, agent) {
  const tool = byName[name];
  const bad = !tool ? `unknown tool "${name}"` : validateInput(tool.input_schema, input);
  if (bad) return { error: true, content: bad };
  onEvent({ agent, type: "tool", tool: name });
  try {
    const out = await tool.run(input);
    const s = typeof out === "string" ? out : JSON.stringify(out);
    return { error: false, content: s.length > 24000 ? s.slice(0, 24000) + "\n…[truncated]" : s };
  } catch (e) {
    return { error: true, content: String(e.message || e).slice(0, 500) };
  }
}

const err = (message, code) => Object.assign(new Error(message), { code });

// The last allowed turn, or a run that is out of time, gets no tools: the
// model must answer with what it has instead of looping until max_turns.
const FINAL_NUDGE = "You are out of tool calls. Return your final answer now as JSON matching the required schema, using what you have already verified.";
const mustFinish = (turn, maxTurns, deadline) => turn >= maxTurns || Boolean(deadline && Date.now() > deadline);

function parseJson(name, text) {
  const t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(t);
  } catch {
    // Some models wrap the JSON in prose: take the outermost {...} block.
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* fall through */ } }
    throw err(`${name}: final answer was not valid JSON.`, "bad_json");
  }
}

async function postJson(url, body, headers, timeoutMs = 120_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    if (e.name === "AbortError") throw err("model call timed out", "timeout");
    throw err(`model call failed: ${e.message}`, "network");
  } finally {
    clearTimeout(t);
  }
}

// Per-call timeout: up to `cap`, never past the run's hard stop (deadline + 30s).
const callTimeout = (deadline, cap) => (deadline ? Math.max(15_000, Math.min(cap, deadline + 30_000 - Date.now())) : cap);
const pastHardStop = (deadline) => Boolean(deadline && Date.now() > deadline + 30_000);

// ---------- Gemini ----------
const GEMINI_THINKING = { low: "low", medium: "medium", high: "high", xhigh: "high", max: "high" };

async function geminiCall(body, deadline, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt && pastHardStop(deadline)) break;
    const r = await postJson(url, body, { "x-goog-api-key": process.env.GEMINI_API_KEY }, callTimeout(deadline, 150_000));
    if (r.ok) return r.data;
    if (r.status === 429 || r.status >= 500) { await new Promise((res) => setTimeout(res, 3000 * (attempt + 1))); continue; }
    if (r.status === 402) throw err("Gemini credit is used up for this project.", "not_configured");
    throw err(`Gemini returned ${r.status}: ${r.data?.error?.message || ""}`.slice(0, 300), r.status === 400 ? "bad_request" : "upstream");
  }
  throw err("Gemini is rate-limiting this project; try again shortly.", "rate_limited");
}

async function runGemini({ name, system, prompt, tools, schema, effort, maxTurns, budget, onEvent, deadline, model }) {
  const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
  const decls = tools.map(({ name: n, description, input_schema }) => ({ name: n, description, parametersJsonSchema: input_schema }));
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  let tokens = 0;
  const gen = (withSchema) => ({
    maxOutputTokens: 16000,
    temperature: 0.3,
    thinkingConfig: { thinkingLevel: GEMINI_THINKING[effort] || "medium" },
    ...(withSchema ? { responseMimeType: "application/json", responseJsonSchema: schema } : {}),
  });
  let combine = true; // tools + JSON schema in one request; falls back if rejected

  for (let turn = 1; turn <= maxTurns; turn++) {
    if (budget && budget.used >= budget.tokens) throw err(`Run token budget (${budget.tokens}) reached.`, "budget");
    const finish = Boolean(decls.length) && mustFinish(turn, maxTurns, deadline);
    if (finish) contents.push({ role: "user", parts: [{ text: FINAL_NUDGE }] });
    let data;
    try {
      data = await geminiCall({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        // Declarations stay (the history holds function calls); calling is switched off.
        ...(decls.length ? { tools: [{ functionDeclarations: decls }] } : {}),
        ...(finish ? { toolConfig: { functionCallingConfig: { mode: "NONE" } } } : {}),
        generationConfig: gen(finish || combine || !decls.length),
      }, deadline, model);
    } catch (e) {
      if (finish) contents.pop();
      if (e.code === "bad_request" && combine && decls.length && !finish) { combine = false; turn--; continue; }
      throw e;
    }
    const used = data.usageMetadata?.totalTokenCount || 0;
    tokens += used;
    if (budget) budget.used += used;

    const cand = data.candidates?.[0];
    if (!cand?.content?.parts?.length) {
      const why = cand?.finishReason || data.promptFeedback?.blockReason || "empty";
      throw err(`${name}: model returned no content (${why}).`, why === "SAFETY" ? "refusal" : "empty");
    }
    if (cand.finishReason === "MAX_TOKENS") throw err(`${name}: output truncated at max tokens.`, "truncated");

    const parts = cand.content.parts;
    const calls = parts.filter((p) => p.functionCall);
    if (!calls.length) {
      const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
      let out;
      if (finish || combine || !decls.length) out = parseJson(name, text);
      else {
        // Tools done; one formatting call against the schema.
        contents.push({ role: "model", parts }, { role: "user", parts: [{ text: "Now return your final answer as JSON matching the required schema." }] });
        const fin = await geminiCall({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: gen(true) }, deadline, model);
        tokens += fin.usageMetadata?.totalTokenCount || 0;
        if (budget) budget.used += fin.usageMetadata?.totalTokenCount || 0;
        out = parseJson(name, (fin.candidates?.[0]?.content?.parts || []).filter((p) => p.text && !p.thought).map((p) => p.text).join(""));
      }
      onEvent({ agent: name, type: "done", turns: turn, tokens });
      return { data: out, turns: turn, tokens };
    }

    // Keep the model's parts verbatim (they carry thought signatures Gemini needs back).
    contents.push({ role: "model", parts });
    const results = await Promise.all(calls.map(async ({ functionCall: fc }) => {
      const r = await runTool(byName, fc.name, fc.args || {}, onEvent, name);
      return { functionResponse: { name: fc.name, ...(fc.id ? { id: fc.id } : {}), response: r.error ? { error: r.content } : { result: r.content } } };
    }));
    contents.push({ role: "user", parts: results });
  }
  throw err(`${name}: no final answer within ${maxTurns} turns.`, "max_turns");
}

// ---------- Ollama (local or Ollama Cloud) ----------
async function runOllama({ name, system, prompt, tools, schema, maxTurns, budget, onEvent, deadline, model }) {
  const host = (process.env.OLLAMA_HOST || (process.env.OLLAMA_API_KEY ? "https://ollama.com" : "http://localhost:11434")).replace(/\/$/, "");
  const headers = process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : {};
  const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
  const defs = tools.map(({ name: n, description, input_schema }) => ({ type: "function", function: { name: n, description, parameters: input_schema } }));
  const messages = [{ role: "system", content: system }, { role: "user", content: prompt }];
  let tokens = 0;

  // Not every Ollama model honours `format`, so the schema is also stated in
  // the instructions; schemaErrors() + the repair pass catch the rest.
  messages[0].content += `

When you give your final answer, reply with ONLY a JSON object matching this JSON Schema (exact property names, all required properties):
${JSON.stringify(schema)}`;
  const call = async (withTools, withSchema) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt && pastHardStop(deadline)) break;
      const r = await postJson(`${host}/api/chat`, { model, messages, stream: false, ...(withTools && defs.length ? { tools: defs } : {}), ...(withSchema ? { format: schema } : {}), options: { temperature: 0.3 } }, headers, callTimeout(deadline, 150_000));
      if (r.ok) return r.data;
      if (r.status === 429 || r.status >= 500) { await new Promise((res) => setTimeout(res, 3000 * (attempt + 1))); continue; }
      throw err(`Ollama returned ${r.status}: ${r.data?.error || r.data?.raw || ""}`.slice(0, 300), r.status === 401 ? "not_configured" : "upstream");
    }
    throw err("Ollama is busy; try again shortly.", "rate_limited");
  };

  for (let turn = 1; turn <= maxTurns; turn++) {
    if (budget && budget.used >= budget.tokens) throw err(`Run token budget (${budget.tokens}) reached.`, "budget");
    const finish = Boolean(defs.length) && mustFinish(turn, maxTurns, deadline);
    if (finish) messages.push({ role: "user", content: FINAL_NUDGE });
    const data = await call(!finish, finish || !defs.length);
    const used = (data.prompt_eval_count || 0) + (data.eval_count || 0);
    tokens += used;
    if (budget) budget.used += used;
    const msg = data.message || {};
    const calls = msg.tool_calls || [];
    if (!calls.length) {
      let out;
      if (finish || !defs.length) out = parseJson(name, msg.content);
      else {
        messages.push({ role: "assistant", content: msg.content || "" }, { role: "user", content: "Now return your final answer as JSON matching the required schema." });
        const fin = await call(false, true);
        tokens += (fin.prompt_eval_count || 0) + (fin.eval_count || 0);
        out = parseJson(name, fin.message?.content);
      }
      onEvent({ agent: name, type: "done", turns: turn, tokens });
      return { data: out, turns: turn, tokens };
    }
    messages.push(msg);
    for (const c of calls) {
      let args = c.function?.arguments;
      if (typeof args === "string") { try { args = JSON.parse(args); } catch { args = null; } }
      const r = await runTool(byName, c.function?.name, args || {}, onEvent, name);
      messages.push({ role: "tool", tool_name: c.function?.name, content: r.error ? `ERROR: ${r.content}` : r.content });
    }
  }
  throw err(`${name}: no final answer within ${maxTurns} turns.`, "max_turns");
}

// ---------- Anthropic ----------
async function runAnthropic({ name, system, prompt, tools, schema, effort, maxTurns, budget, onEvent, deadline, model }) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const toolDefs = tools.map(({ name: n, description, input_schema }) => ({ name: n, description, input_schema }));
  const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
  const messages = [{ role: "user", content: prompt }];
  let tokens = 0, useFallbacks = process.env.CREW_FALLBACKS !== "off";

  for (let turn = 1; turn <= maxTurns; turn++) {
    if (budget && budget.used >= budget.tokens) throw err(`Run token budget (${budget.tokens}) reached.`, "budget");
    const params = {
      model, max_tokens: 16000, system, messages,
      ...(toolDefs.length ? { tools: toolDefs } : {}),
      output_config: { effort, format: { type: "json_schema", schema } },
    };
    if (toolDefs.length && mustFinish(turn, maxTurns, deadline)) {
      params.tool_choice = { type: "none" };
      params.messages = [...messages, { role: "user", content: FINAL_NUDGE }];
    }
    let message;
    try {
      const stream = useFallbacks
        ? client.beta.messages.stream({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
        : client.messages.stream(params);
      message = await stream.finalMessage();
    } catch (e) {
      if (useFallbacks && e instanceof Anthropic.BadRequestError && /fallback|beta/i.test(e.message)) { useFallbacks = false; turn--; continue; }
      if (e instanceof Anthropic.RateLimitError) { await new Promise((r) => setTimeout(r, 4000)); turn--; continue; }
      throw e;
    }
    const used = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);
    tokens += used; if (budget) budget.used += used;
    if (message.stop_reason === "refusal") throw err(`${name}: request declined by safety classifiers (${message.stop_details?.category || "unspecified"}).`, "refusal");
    if (message.stop_reason === "max_tokens") throw err(`${name}: output truncated at max_tokens.`, "truncated");
    if (message.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: message.content }); continue; }
    const toolUses = message.content.filter((b) => b.type === "tool_use");
    if (!toolUses.length) {
      const out = parseJson(name, message.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
      onEvent({ agent: name, type: "done", turns: turn, tokens });
      return { data: out, turns: turn, tokens };
    }
    messages.push({ role: "assistant", content: message.content });
    const results = await Promise.all(toolUses.map(async (tu) => {
      const r = await runTool(byName, tu.name, tu.input, onEvent, name);
      return { type: "tool_result", tool_use_id: tu.id, ...(r.error ? { is_error: true } : {}), content: r.content };
    }));
    messages.push({ role: "user", content: results });
  }
  throw err(`${name}: no final answer within ${maxTurns} turns.`, "max_turns");
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
 * @param {number} [spec.deadline]    epoch ms; past it the agent stops using tools and answers
 * @param {Function} [spec.llm]        test seam: replaces the model call entirely
 */
export async function runAgent(spec) {
  const { name, system, prompt, tools = [], schema, effort = "medium", maxTurns = 8, budget, onEvent = () => {}, deadline = null } = spec;
  if (spec.llm) { // scripted model for tests — same contract as the real loop
    const r = await spec.llm({ name, system, prompt, tools, schema });
    onEvent({ agent: name, type: "scripted" });
    return { data: r, turns: 1, tokens: 0 };
  }
  const chain = providerChain();
  if (!chain.length) throw err("No AI provider is configured for the crew (set GEMINI_API_KEY, OLLAMA_API_KEY/OLLAMA_HOST or ANTHROPIC_API_KEY).", "not_configured");
  // Provider-level failures move to the next provider; content problems don't.
  const FALLBACK_ON = new Set(["not_configured", "rate_limited", "upstream", "network", "timeout"]);
  let p = chain[0];
  const call = (prov, a) => {
    const args = { ...a, model: modelFor(prov, prov === chain[0]) };
    return prov === "gemini" ? runGemini(args) : prov === "ollama" ? runOllama(args) : runAnthropic(args);
  };
  const run = async (a) => {
    let last;
    for (const prov of chain.slice(chain.indexOf(p))) {
      try { p = prov; return await call(prov, a); }
      catch (e) {
        last = e;
        if (!FALLBACK_ON.has(e.code) || prov === chain[chain.length - 1] || pastHardStop(a.deadline)) throw e;
        onEvent({ agent: name, type: "fallback", from: prov, reason: e.code });
      }
    }
    throw last;
  };
  const res = await run({ name, system, prompt, tools, schema, effort, maxTurns, budget, onEvent, deadline });
  const problems = schemaErrors(schema, res.data);
  if (!problems.length) return res;
  // One repair attempt without tools: hand back the answer and what's wrong with it.
  onEvent({ agent: name, type: "repair", problems: problems.slice(0, 4) });
  const fixed = await run({
    name, system, schema, effort, budget, onEvent, deadline, tools: [], maxTurns: 1,
    prompt: [
      prompt,
      "Your previous answer did not match the required schema:",
      ...problems.map((x) => `- ${x}`),
      `Previous answer:\n${JSON.stringify(res.data).slice(0, 12000)}`,
      "Return the corrected, complete JSON answer.",
    ].join("\n\n"),
  });
  const still = schemaErrors(schema, fixed.data);
  if (still.length) throw err(`${name}: answer still doesn't match the schema (${still.slice(0, 3).join("; ")}).`, "bad_schema");
  return { data: fixed.data, turns: res.turns + fixed.turns, tokens: res.tokens + fixed.tokens };
}
