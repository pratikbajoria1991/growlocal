// TypeSafe Jev client — typed questions in, typed answers + confidence out.
// Docs: https://docs.typesafe.ai/introduction/quickstart
// Used for classification only; it never writes or sends anything.

const URL_ = "https://api.typesafe.ai/v1/systemone";
const TIMEOUT_MS = 15_000;

export const typesafeConfigured = () => Boolean(process.env.TYPESAFE_API_KEY);

export async function ask(state, questions, model = "jev-latest") {
  if (!typesafeConfigured()) throw Object.assign(new Error("TYPESAFE_API_KEY is not set."), { code: "not_configured" });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL_, {
      method: "POST",
      signal: ctrl.signal,
      cache: "no-store",
      headers: { Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: String(state).slice(0, 8000), model, questions }),
    });
    if (!res.ok) throw Object.assign(new Error(`TypeSafe HTTP ${res.status}`), { code: "upstream" });
    return (await res.json()).answers;
  } finally {
    clearTimeout(timer);
  }
}

export const REPLY_INTENTS = {
  interested: "Wants the proposal, pricing, a call or more details",
  not_now: "Declines or wants to be contacted later",
  stop: "Asks not to be messaged again, or is annoyed by the message",
  question: "Asks who we are, how we got their number, or another question",
  other: "Unrelated or unclear",
};

/** Classifies a reply (English, Hindi, Bengali or mixed). Returns null if Jev is unavailable. */
export async function classifyReply(text) {
  try {
    const a = await ask(text, {
      intent: {
        type: "choice",
        instructions: "A local business owner replied to a cold outreach message about Google Maps and AI search visibility. What do they want?",
        criteria: REPLY_INTENTS,
      },
    });
    const r = a.intent;
    return { intent: r.choice, confidence: r.confidence, probabilities: r.probabilities };
  } catch (e) {
    console.error("[typesafe]", e.code || e.message);
    return null;
  }
}

const IMPACT_LEVELS = [
  "Cosmetic — a prospect who already found the business wouldn't notice",
  "Minor — a small trust or completeness gap",
  "Meaningful — likely costs the business real inquiries",
  "Major — a prospect frequently can't find, trust or reach the business because of this",
];

/**
 * Scores how much fixing each issue would help THIS business win more
 * customers, given its category and area. One request, all issues in
 * parallel (TypeSafe's fan-out — no extra latency per question).
 * Returns { [issueId]: { impact: 0-1, confidence } } or null if unavailable
 * or if any issue comes back without a usable confidence — callers should
 * fall back to the explicit weight rubric rather than half-trust this.
 * @param {{name: string, category: string, area: string}} business
 * @param {{id: string, title: string, why?: string}[]} issues capped by caller (~12)
 */
export async function rankIssueImpact(business, issues) {
  if (!issues.length) return null;
  const state = `Business: ${business.name}\nCategory: ${business.category || "local business"}\nArea: ${business.area || "unknown"}`;
  const questions = Object.fromEntries(issues.map((iss) => [
    iss.id,
    {
      type: "score",
      instructions: `If this issue were fixed, how much would it help this specific business get more customers via Google or AI search: "${iss.title}"${iss.why ? ` (${iss.why})` : ""}`,
      criteria: IMPACT_LEVELS,
    },
  ]));
  try {
    const answers = await ask(state, questions);
    const out = {};
    for (const iss of issues) {
      const a = answers[iss.id];
      if (!a || typeof a.score !== "number") return null;
      // `score` is the criteria-weighted expected index (0..levels-1, e.g. 0.03
      // on a 4-level scale means "almost certainly level 0") — normalize to 0-1.
      out[iss.id] = { impact: a.score / (IMPACT_LEVELS.length - 1), confidence: a.confidence };
    }
    return out;
  } catch (e) {
    console.error("[typesafe]", e.code || e.message);
    return null;
  }
}
