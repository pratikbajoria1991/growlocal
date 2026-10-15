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

  const target = norm(business);
  const hay = norm(answer);
  const tokens = target.split(" ").filter((t) => t.length > 2);
  const mentioned = Boolean(target) && (hay.includes(target) || (tokens.length >= 2 && tokens.every((t) => hay.includes(t))));

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
