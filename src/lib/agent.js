// Growlocal AI agent. Uses ANTHROPIC_API_KEY server-side.
// Falls back to structured stubs when no key is set, so the flow is testable end-to-end.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export const AGENT_ACTIONS = {
  posts: {
    label: "Draft this week's GBP posts",
    hint: "2 posts with photo suggestions and CTAs",
    system:
      "You are a Google Business Profile content strategist. You write warm, specific posts that sound like a real business owner, never like marketing copy. You never invent facts — where you need a detail you don't have, you write <FILL: what's needed>.",
    prompt: (u) => `Draft 2 Google Business Profile posts for this week.

Business: ${u.gbp?.business_name || u.email.split("@")[0]}
Vertical: ${u.vertical || "local business"}

Mix one service highlight and one seasonal/local hook. For each post output:

## Post N — <type> — <short title>
**Photo to attach:** <what to shoot with a phone>
**CTA button:** Book / Call / Learn more / Order online / Directions
**Publish:** <weekday + time of day>

<body, 100-150 words>`,
  },
  replies: {
    label: "Draft review replies",
    hint: "Personalised reply per review",
    system:
      "You write Google review replies that sound human. You name the specific thing the reviewer mentioned, you own any friction without excuses, and you never argue publicly. For 1-2 star reviews you empathise and move the conversation offline.",
    prompt: (u) => `Write 3 sample Google review replies for this business — one 5-star, one 3-star with mixed feedback, one 1-star. Invent realistic sample reviews for the vertical first, then reply to each.

Business: ${u.gbp?.business_name || u.email.split("@")[0]}
Vertical: ${u.vertical || "local business"}

Format each as:
## <rating>★ — <reviewer first name>
> <the sample review>

**Reply:**
<40-70 words>`,
  },
  faq: {
    label: "Generate FAQ + schema",
    hint: "15 questions with FAQPage JSON-LD",
    system:
      "You write FAQ content engineered for Answer Engine Optimization. Every answer opens with a direct statement and stays between 150 and 250 characters. No filler, no 'great question'.",
    prompt: (u) => `Write 15 FAQs for this business: 5 on services, 3 on pricing, 3 on booking/availability, 4 on trust and what to expect.

Business: ${u.gbp?.business_name || u.email.split("@")[0]}
Vertical: ${u.vertical || "local business"}

Output each as:
Q: <question a real customer would type>
A: <150-250 chars, direct answer first>

Then output a complete FAQPage JSON-LD block containing all 15, ready to paste into <head>.`,
  },
  report: {
    label: "Generate monthly report",
    hint: "Performance summary + next actions",
    system:
      "You are a local visibility analyst. You are specific, you are honest about what you don't know, and every recommended action is measurable.",
    prompt: (u) => `Write this month's performance report template for the business below. We don't have live Insights data connected yet, so use <FILL: metric> placeholders where real numbers will land, but write the full narrative structure.

Business: ${u.gbp?.business_name || u.email.split("@")[0]}
Vertical: ${u.vertical || "local business"}

Sections: Snapshot table, What worked, What didn't, Where traffic came from, Three actions for next month. Under 600 words.`,
  },
};

function stub(actionId, u) {
  const name = u.gbp?.business_name || u.email.split("@")[0];
  return `# ${AGENT_ACTIONS[actionId].label} — draft

> Running in stub mode. Set ANTHROPIC_API_KEY to generate real content with Claude.

**Business:** ${name}

<FILL: This is a placeholder. With an Anthropic API key configured, this action produces full ${AGENT_ACTIONS[actionId].hint.toLowerCase()} tailored to your business, vertical and Google Business Profile data.>
`;
}

export async function runAgent(actionId, user) {
  const spec = AGENT_ACTIONS[actionId];
  if (!spec) throw new Error("Unknown action");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const started = Date.now();

  if (!apiKey) {
    return { output: stub(actionId, user), source: "stub", ms: Date.now() - started };
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      system: spec.system,
      messages: [{ role: "user", content: spec.prompt(user) }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Claude API returned ${res.status}`);

  return {
    output: data.content?.[0]?.text || "",
    source: "claude",
    ms: Date.now() - started,
  };
}
