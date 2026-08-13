// AI Visibility checker — can AI crawlers actually reach your site?
//
// Every check here is deterministic: we fetch robots.txt and llms.txt and read
// what they say. No guessing, no AI required.

const TIMEOUT_MS = 8000;

// The crawlers that feed AI answer engines. Blocking these removes you from
// the training and retrieval corpora that decide who gets cited.
export const AI_CRAWLERS = [
  { ua: "GPTBot", owner: "OpenAI", purpose: "Trains and grounds ChatGPT answers", weight: 20 },
  { ua: "OAI-SearchBot", owner: "OpenAI", purpose: "Powers ChatGPT Search results", weight: 15 },
  { ua: "ClaudeBot", owner: "Anthropic", purpose: "Trains and grounds Claude answers", weight: 15 },
  { ua: "PerplexityBot", owner: "Perplexity", purpose: "Indexes pages for Perplexity citations", weight: 15 },
  { ua: "Google-Extended", owner: "Google", purpose: "Controls use in Gemini and AI Overviews", weight: 20 },
  { ua: "CCBot", owner: "Common Crawl", purpose: "Feeds the open corpus most models train on", weight: 10 },
  { ua: "Applebot-Extended", owner: "Apple", purpose: "Apple Intelligence and Siri answers", weight: 5 },
];

async function grab(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; GrowlocalBot/1.0; +https://growlocal.vercel.app)" },
    });
    if (!res.ok) return { ok: false, status: res.status, body: "" };
    const body = (await res.text()).slice(0, 200_000);
    return { ok: true, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: "" };
  } finally {
    clearTimeout(timer);
  }
}

// robots.txt is grouped by user-agent. Parse into { agent: [rules] } so we can
// answer "is this specific bot allowed" rather than pattern-matching the file.
function parseRobots(txt) {
  const groups = [];
  let current = null;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();

    if (field === "user-agent") {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (field === "allow" || field === "disallow")) {
      current.rules.push({ type: field, path: value });
    }
  }
  return groups;
}

// Longest-match wins, allow beats disallow on a tie — the standard rule.
function verdictFor(groups, agent) {
  const lower = agent.toLowerCase();
  const specific = groups.filter((g) => g.agents.includes(lower));
  const wildcard = groups.filter((g) => g.agents.includes("*"));
  const applicable = specific.length ? specific : wildcard;
  if (!applicable.length) return { allowed: true, reason: "No rule targets this crawler — allowed by default", explicit: false };

  let best = null;
  for (const g of applicable) {
    for (const r of g.rules) {
      if (r.path === "" && r.type === "disallow") continue; // "Disallow:" empty means allow all
      if (r.path === "/" || "/".startsWith(r.path) || r.path === "") {
        if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.type === "allow")) {
          best = r;
        }
      }
    }
  }
  if (!best) {
    return {
      allowed: true,
      reason: specific.length ? "Targeted by name, but nothing blocks the homepage" : "Covered by wildcard rules, homepage not blocked",
      explicit: specific.length > 0,
    };
  }
  const allowed = best.type === "allow";
  return {
    allowed,
    reason: allowed
      ? `Explicitly allowed (${best.type}: ${best.path || "/"})`
      : `Blocked by "${best.type}: ${best.path}"${specific.length ? " in a rule naming this crawler" : " in the wildcard rules"}`,
    explicit: specific.length > 0,
  };
}

export async function checkAiVisibility(rawUrl) {
  let origin;
  try {
    const u = new URL(/^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`);
    origin = u.origin;
  } catch {
    throw new Error("That doesn't look like a valid URL. Try something like example.com");
  }

  const [robots, llms] = await Promise.all([grab(`${origin}/robots.txt`), grab(`${origin}/llms.txt`)]);

  const groups = robots.ok ? parseRobots(robots.body) : [];
  const crawlers = AI_CRAWLERS.map((c) => {
    const v = robots.ok
      ? verdictFor(groups, c.ua)
      : { allowed: true, reason: "No robots.txt found — everything is allowed by default", explicit: false };
    return { ...c, ...v };
  });

  const blocked = crawlers.filter((c) => !c.allowed);
  const earned = crawlers.filter((c) => c.allowed).reduce((n, c) => n + c.weight, 0);
  const maxWeight = AI_CRAWLERS.reduce((n, c) => n + c.weight, 0);

  // Sitemap presence is a real discoverability signal, worth flagging.
  const sitemaps = robots.ok ? (robots.body.match(/^\s*sitemap\s*:\s*(\S+)/gim) || []).length : 0;

  const notes = [];
  if (!robots.ok) {
    notes.push({
      kind: "warn",
      text: "No robots.txt found. Nothing is blocked, which is fine — but you also have no way to state a preference, and no place to declare your sitemap.",
      fix: `Create /robots.txt with "User-agent: *" then "Allow: /", and a "Sitemap: ${origin}/sitemap.xml" line.`,
    });
  }
  if (robots.ok && sitemaps === 0) {
    notes.push({
      kind: "warn",
      text: "robots.txt has no Sitemap directive.",
      fix: `Add "Sitemap: ${origin}/sitemap.xml" to robots.txt so crawlers find every page rather than only what they can reach by following links.`,
    });
  }
  if (llms.ok) {
    notes.push({ kind: "good", text: "llms.txt found — you're publishing an AI-readable summary of your site.", fix: null });
  } else {
    notes.push({
      kind: "info",
      text: "No llms.txt. This is an emerging convention, not yet widely honoured, so its absence costs you nothing today.",
      fix: `Optional: add /llms.txt with a short plain-text summary of your business and links to your most useful pages.`,
    });
  }

  const score = Math.round((earned / maxWeight) * 100);

  return {
    origin,
    score,
    grade: score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F",
    robotsFound: robots.ok,
    robotsUrl: `${origin}/robots.txt`,
    llmsFound: llms.ok,
    sitemapDeclared: sitemaps > 0,
    crawlers,
    blockedCount: blocked.length,
    allowedCount: crawlers.length - blocked.length,
    notes,
    robotsPreview: robots.ok ? robots.body.slice(0, 2000) : null,
    checkedAt: new Date().toISOString(),
  };
}
