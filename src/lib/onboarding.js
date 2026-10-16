// Owner onboarding: the facts the Growth Crew may state about a business.
// Pure helpers, safe to import from client components. Everything an owner
// writes here becomes "owner-supplied" text the fact-checker accepts, so the
// form asks only for things the owner knows first-hand.

const s = (v, max) => String(v ?? "").replace(/\s+\n/g, "\n").trim().slice(0, max);
const rows = (v, max, shape) => (Array.isArray(v) ? v : []).map(shape).filter((r) => Object.values(r).some(Boolean)).slice(0, max);

export const AUTO_OPTIONS = [
  ["posts", "Weekly Google posts about services and offers you've confirmed"],
  ["positiveReplies", "Replies to 4 and 5 star reviews"],
  ["websiteTech", "Technical website fixes (page titles, FAQ, schema)"],
];
// Never automatic, whatever the owner picks: these can hurt a profile.
export const ALWAYS_ASK = ["Business name, category, address or hours", "Replies to 1 to 3 star reviews", "Changes to your website's wording"];

export function normalizeOnboarding(d = {}) {
  return {
    goal: s(d.goal, 300),
    hours: s(d.hours, 600),
    holidays: s(d.holidays, 300),
    serviceAreas: s(d.serviceAreas, 400),
    services: rows(d.services, 30, (r) => ({ name: s(r?.name, 120), price: s(r?.price, 80) })).filter((r) => r.name),
    team: rows(d.team, 15, (r) => ({ name: s(r?.name, 100), role: s(r?.role, 120), credentials: s(r?.credentials, 200) })).filter((r) => r.name),
    highlights: s(d.highlights, 800),
    faqs: rows(d.faqs, 10, (r) => ({ q: s(r?.q, 200), a: s(r?.a, 600) })).filter((r) => r.q && r.a),
    competitors: s(d.competitors, 400),
    tone: s(d.tone, 300),
    avoid: s(d.avoid, 500),
    auto: Object.fromEntries(AUTO_OPTIONS.map(([k]) => [k, d.auto?.[k] !== false])),
    approver: { name: s(d.approver?.name, 80), whatsapp: s(d.approver?.whatsapp, 30), email: s(d.approver?.email, 120).toLowerCase() },
    negativeReviews: d.negativeReviews === "alert" ? "alert" : "draft",
  };
}

// What counts toward "setup complete". Consent is tracked separately.
const CHECKS = [
  ["goal", "Your main goal", (o) => o.goal],
  ["hours", "Opening hours", (o) => o.hours],
  ["services", "At least 3 services", (o) => o.services.length >= 3],
  ["faqs", "At least 5 customer questions with answers", (o) => o.faqs.length >= 5],
  ["serviceAreas", "Areas you serve", (o) => o.serviceAreas],
  ["highlights", "What makes you different", (o) => o.highlights],
  ["approver", "Who approves changes (WhatsApp or email)", (o) => o.approver.whatsapp || o.approver.email],
];

export function onboardingProgress(o, consent) {
  const ob = normalizeOnboarding(o || {});
  const missing = CHECKS.filter(([, , ok]) => !ok(ob)).map(([k, label]) => ({ k, label }));
  if (!consent?.posting || !consent?.data) missing.push({ k: "consent", label: "Both permissions at the end of the form" });
  const total = CHECKS.length + 1;
  return { done: total - missing.length, total, pct: Math.round(((total - missing.length) / total) * 100), missing };
}

// The text block the crew and its fact-checker read. Only owner statements.
export function onboardingFacts(o) {
  if (!o) return "";
  const ob = normalizeOnboarding(o);
  const L = [];
  if (ob.hours) L.push(`Opening hours: ${ob.hours}`);
  if (ob.holidays) L.push(`Closures and holidays: ${ob.holidays}`);
  if (ob.serviceAreas) L.push(`Areas served: ${ob.serviceAreas}`);
  if (ob.services.length) L.push(`Services: ${ob.services.map((x) => (x.price ? `${x.name} (${x.price})` : x.name)).join("; ")}`);
  if (ob.team.length) L.push(`Team: ${ob.team.map((t) => [t.name, t.role, t.credentials].filter(Boolean).join(", ")).join("; ")}`);
  if (ob.highlights) L.push(`What sets us apart: ${ob.highlights}`);
  if (ob.faqs.length) L.push(`Customer questions:\n${ob.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}`);
  if (ob.tone) L.push(`Tone of voice: ${ob.tone}`);
  if (ob.avoid) L.push(`Never say or claim: ${ob.avoid}`);
  return L.length ? `[Owner onboarding form]\n${L.join("\n")}` : "";
}
