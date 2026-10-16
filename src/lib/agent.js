// Growlocal AI agent. Uses GEMINI_API_KEY server-side (Google's Gemini API).
// Falls back to structured stubs when no key is set, so the flow is testable end-to-end.

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const geminiUrl = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

// The agent works on a "subject" — a business it is writing for. That's either
// the signed-in user's own profile, or a client we're servicing by hand from
// the concierge console. Normalising here keeps the prompts identical for both,
// so what we deliver manually is exactly what the product will deliver later.
export function toSubject(source = {}) {
  if (source.isSubject) return source;
  return {
    isSubject: true,
    name: source.name || source.gbp?.business_name || source.email?.split("@")[0] || "this business",
    vertical: source.vertical || "local business",
    city: source.city || "",
    website: source.website || "",
    services: source.services || "",
    notes: source.notes || "",
  };
}

// Extra context lines, only included when we actually have them — an empty
// "City:" line in the prompt invites the model to invent one.
function context(s) {
  return [
    `Business: ${s.name}`,
    `Vertical: ${s.vertical}`,
    s.city && `City / area served: ${s.city}`,
    s.website && `Website: ${s.website}`,
    s.services && `Services: ${s.services}`,
    s.notes && `Extra context: ${s.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const AGENT_ACTIONS = {
  posts: {
    label: "Draft this week's GBP posts",
    hint: "2 posts with photo suggestions and CTAs",
    system:
      "You are a Google Business Profile content strategist. You write warm, specific posts that sound like a real business owner, never like marketing copy. You never invent facts — where you need a detail you don't have, you write <FILL: what's needed>.",
    prompt: (s, input) => `Draft 2 Google Business Profile posts for this week.

${context(s)}
${input ? `\nWhat's happening this week (use this, don't ignore it):\n${input}\n` : ""}
Mix one service highlight and one seasonal/local hook. For each post output:

## Post N — <type> — <short title>
**Photo to attach:** <what to shoot with a phone>
**CTA button:** Book / Call / Learn more / Order online / Directions
**Publish:** <weekday + time of day>

<body, 100-150 words>`,
  },
  replies: {
    label: "Draft review replies",
    hint: "Paste real reviews, get replies",
    inputLabel: "Paste the actual reviews (one per line, include the star rating)",
    inputPlaceholder: "5★ Rakesh — Great experience, Dr. Sharma explained everything clearly.\n2★ Anon — Waited 45 minutes past my appointment time.",
    system:
      "You write Google review replies that sound human. You name the specific thing the reviewer mentioned, you own any friction without excuses, and you never argue publicly. For 1-2 star reviews you empathise and move the conversation offline. Never invent facts about what happened — if you need a detail, write <FILL: what's needed>.",
    prompt: (s, input) => input
      ? `Write a Google review reply for each review below.

${context(s)}

Reviews:
${input}

For each, output:
## <rating>★ — <reviewer name>
**Reply:**
<40-70 words, specific to what they actually said>`
      : `Write 3 sample Google review replies for this business — one 5-star, one 3-star with mixed feedback, one 1-star. Invent realistic sample reviews for the vertical first, then reply to each. Label these clearly as SAMPLES, not real reviews.

${context(s)}

Format each as:
## <rating>★ — <reviewer first name>  [SAMPLE]
> <the sample review>

**Reply:**
<40-70 words>`,
  },
  faq: {
    label: "Generate FAQ + schema",
    hint: "15 questions with FAQPage JSON-LD",
    system:
      "You write FAQ content engineered for Answer Engine Optimization. Every answer opens with a direct statement and stays between 150 and 250 characters. No filler, no 'great question'.",
    prompt: (s, input) => `Write 15 FAQs for this business: 5 on services, 3 on pricing, 3 on booking/availability, 4 on trust and what to expect.

${context(s)}
${input ? `\nReal questions this business actually gets asked — prioritise these:\n${input}\n` : ""}
Output each as:
Q: <question a real customer would type>
A: <150-250 chars, direct answer first>

Then output a complete FAQPage JSON-LD block containing all 15, ready to paste into <head>.`,
  },
  calendar: {
    label: "Plan the month's content",
    hint: "8 topics mapped to real customer questions",
    inputLabel: "Anything specific to cover this month? (optional)",
    inputPlaceholder: "New implant service launching. Monsoon season. Diwali offers.",
    system:
      "You are a local content strategist. You plan content around questions customers actually type before buying, not around keywords. You are ruthless about volume: fewer, better pieces beat a daily churn of thin posts, and you say so if asked for more than the business can genuinely support.",
    prompt: (s, input) => `Plan one month of website content for this business — 8 pieces, roughly two per week.

${context(s)}
${input ? `\nSpecific things to work in:\n${input}\n` : ""}
Two per week is deliberate: a local business rarely has enough genuinely distinct
things to say for a daily cadence, and thin repetitive posts damage search
performance rather than helping it. Do not pad the list to fill space — if this
business can only support fewer strong pieces, say so and plan fewer.

For each piece output:

## Week N — <the customer question as the title>
**Search intent:** <what the person actually wants>
**Format:** FAQ answer / how-to / comparison / local guide / service explainer
**Word count:** <realistic target>
**Why this one:** <the buying decision it unblocks, in one line>`,
  },
  blogpost: {
    label: "Write a blog post",
    hint: "Full post + Article & FAQ schema",
    inputLabel: "Which topic? Paste a title or question from the calendar",
    inputPlaceholder: "How much does a dental implant cost near me?",
    system:
      "You write local business content engineered for answer engines. You open with a direct answer in the first two sentences, use question-shaped subheadings, and keep paragraphs between 40 and 320 characters so they can be quoted whole. You never invent prices, credentials, or claims — where a real detail is needed you write <FILL: what's needed>.",
    prompt: (s, input) => `Write a complete, publish-ready blog post for this business.

${context(s)}

Topic: ${input || "Choose the single highest-intent question this business should rank for, and say why you chose it."}

Structure:
1. An H1 written as the customer's question
2. A direct answer in the first 2 sentences — this is the part an AI will quote
3. Question-shaped H2 subheadings throughout
4. Paragraphs of 40-320 characters
5. A short FAQ section of 4-5 related questions at the end
6. A closing call to action naming the business and location

Then output, in separate code blocks, ready to paste:
- Article JSON-LD (headline, description, author, datePublished, publisher)
- FAQPage JSON-LD covering the FAQ section

Do not invent prices, timelines, or qualifications. Use <FILL: …> instead.`,
  },
  report: {
    label: "Generate monthly report",
    hint: "Performance summary + next actions",
    system:
      "You are a local visibility analyst. You are specific, you are honest about what you don't know, and every recommended action is measurable.",
    prompt: (s, input) => `Write this month's performance report for the business below.

${context(s)}
${input ? `\nActual numbers from Google Business Profile Insights — use these, do not invent others:\n${input}\n` : `\nWe don't have Insights numbers for this month, so use <FILL: metric> placeholders where real numbers will land. Do NOT invent figures.\n`}
Sections: Snapshot table, What worked, What didn't, Where traffic came from, Three actions for next month. Under 600 words.`,
  },
};

function stub(actionId, s) {
  return `# ${AGENT_ACTIONS[actionId].label} — draft

> **Stub mode — this is not real generated content.** Set \`GEMINI_API_KEY\` on the
> server and re-run to get actual drafts. Nothing below is usable as-is.

**Business:** ${s.name}
**Vertical:** ${s.vertical}${s.city ? `\n**Area:** ${s.city}` : ""}

<FILL: With a Gemini API key configured, this action produces ${AGENT_ACTIONS[actionId].hint.toLowerCase()} written from this business's real details.>
`;
}

export async function runAgent(actionId, source, input = "") {
  const spec = AGENT_ACTIONS[actionId];
  if (!spec) throw new Error("Unknown action");

  const subject = toSubject(source);
  const apiKey = process.env.GEMINI_API_KEY;
  const started = Date.now();

  if (!apiKey) {
    return { output: stub(actionId, subject), source: "stub", ms: Date.now() - started };
  }

  const res = await fetch(geminiUrl(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: spec.system }] },
      contents: [{ role: "user", parts: [{ text: spec.prompt(subject, (input || "").trim()) }] }],
      generationConfig: { maxOutputTokens: 4000 },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Gemini API returned ${res.status}`);

  return {
    output: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    source: "gemini",
    ms: Date.now() - started,
  };
}
