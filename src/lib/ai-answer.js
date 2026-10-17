// Asks Gemini, with Google Search grounding, the question a customer would
// ask ("best dentist in Salt Lake, Kolkata") and checks whether the business
// is named in the answer. Also returns the web pages the answer was built
// from, because those are the sites a business needs to be listed on.

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const endpoint = () => `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(the|pvt|ltd|private|limited|llp|clinic|centre|center)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function aiAnswerConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Whole business name, or every word of a 2+ word name, appears in the answer.
export function isMentioned(business, answer) {
  const target = norm(business);
  const hay = norm(answer);
  const tokens = target.split(" ").filter((t) => t.length > 2);
  return Boolean(target) && (hay.includes(target) || (tokens.length >= 2 && tokens.every((t) => hay.includes(t))));
}

// ---------- ChatGPT (OpenAI Responses API with web search) ----------
export function chatgptConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Same question as aiAnswerCheck, asked of ChatGPT searching the live web. */
export async function chatgptAnswerCheck({ business, keyword, area, country = "IN" }) {
  const question = `Which are the best ${keyword.trim()} in ${area.trim()}? Recommend specific businesses by name with a one-line reason each.`;
  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45_000);
  let data;
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model,
        input: question,
        tools: [{ type: "web_search", user_location: { type: "approximate", country, ...(area ? { city: area.split(",").pop().trim() } : {}) } }],
        tool_choice: "auto",
      }),
    });
    data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `OpenAI returned ${res.status}`);
  } catch (e) {
    throw new Error(e.name === "AbortError" ? "ChatGPT took too long to answer." : e.message);
  } finally {
    clearTimeout(t);
  }

  const parts = (data.output || []).filter((o) => o.type === "message").flatMap((m) => m.content || []).filter((c) => c.type === "output_text");
  const answer = parts.map((p) => p.text || "").join("").trim();
  if (!answer) throw new Error("ChatGPT didn't return an answer.");
  const seen = new Set();
  const sources = [];
  for (const a of parts.flatMap((p) => p.annotations || [])) {
    if (a.type !== "url_citation" || !a.url) continue;
    let host;
    try { host = new URL(a.url).hostname.replace(/^www\./, ""); } catch { continue; }
    if (seen.has(host)) continue;
    seen.add(host);
    sources.push({ title: host, uri: `https://${host}` });
  }
  return {
    checkedAt: new Date().toISOString(),
    model,
    grounded: (data.output || []).some((o) => o.type === "web_search_call"),
    question,
    answer: answer.slice(0, 4000),
    mentioned: isMentioned(business, answer),
    sources: sources.slice(0, 10),
  };
}

// Two attempts must fit inside the route's 60s limit.
async function ask(question, grounded) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), grounded ? 30_000 : 20_000);
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: question }] }],
        ...(grounded ? { tools: [{ google_search: {} }] } : {}),
        // Gemini 3 counts its thinking against the output budget; keep thinking
        // low and leave room so the answer isn't cut off mid-list.
        generationConfig: { maxOutputTokens: 6000, temperature: 0.2, thinkingConfig: { thinkingLevel: "low" } },
      }),
    });
    const data = await res.json();
    if (res.status === 402 || res.status === 429 || res.status === 403) {
      // Billing, quota or key problems: retrying without grounding won't help.
      const e = new Error("The AI answer check is temporarily unavailable. Try again later.");
      e.code = "not_configured";
      e.fatal = true;
      throw e;
    }
    if (!res.ok) throw new Error(data?.error?.message || `Gemini returned ${res.status}`);
    return data;
  } finally {
    clearTimeout(t);
  }
}

/**
 * @param {{business:string, keyword:string, area:string}} input
 */
export async function aiAnswerCheck({ business, keyword, area }) {
  const question = `Which are the best ${keyword.trim()} in ${area.trim()}? Recommend specific businesses by name with a one-line reason each.`;
  let data;
  let grounded = true;
  try {
    data = await ask(question, true);
  } catch (e) {
    if (e.fatal) throw e;
    if (e.name === "AbortError") {
      const err = new Error("The AI took too long to answer. Try again.");
      err.userFacing = true;
      throw err;
    }
    grounded = false;
    data = await ask(question, false);
  }

  const cand = data.candidates?.[0] || {};
  const answer = (cand.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!answer) {
    const e = new Error("The AI didn't return an answer. Try a different keyword.");
    e.userFacing = true;
    throw e;
  }

  const mentioned = isMentioned(business, answer);

  const sources = [];
  const seen = new Set();
  for (const c of cand.groundingMetadata?.groundingChunks || []) {
    const title = c.web?.title;
    if (!title || seen.has(title)) continue;
    seen.add(title);
    // Grounding URIs are short-lived Google redirect links; the title is the
    // source's domain, so link to that directly when it looks like one.
    const domain = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(title) ? title : null;
    sources.push({ title, uri: domain ? `https://${domain}` : c.web?.uri || null });
  }

  return {
    checkedAt: new Date().toISOString(),
    model: MODEL,
    grounded,
    question,
    answer: answer.slice(0, 4000),
    mentioned,
    sources: sources.slice(0, 10),
  };
}
