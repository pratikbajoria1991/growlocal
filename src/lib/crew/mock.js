// Scripted stand-in for Claude, for testing the crew's plumbing (routing,
// guardrails, patching, before/after audit, ledger) without spending tokens.
// It is NOT a quality benchmark — real runs use Claude (see llm.js).
// Disabled in production by the route.
//
// It deliberately includes one dishonest draft (superlative + invented
// figure) so tests prove the independent guardrails catch it even when the
// reviewer "agrees".

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function mockLlm({ includeBadDraft = true } = {}) {
  return async ({ name, tools, prompt }) => {
    const facts = (await tools.find((t) => t.name === "get_facts").run({})).facts;
    const ids = [...prompt.matchAll(/\[([a-z_0-9]+)\]/g)].map((m) => m[1]);
    const area = (facts.address || "").split(",").slice(-3, -2)[0]?.trim() || "";

    if (name === "planner") {
      const issues = JSON.parse(prompt.slice(prompt.indexOf("["), prompt.lastIndexOf("]") + 1));
      const route = (i) => (i.id === "web_basics" ? "seo" : i.id === "web_answers" ? "aeo" : i.id === "web_local" || i.id === "web_schema" ? "geo" : (i.source === "gbp" || i.source === "competitors") ? "gbp" : null);
      const by = {}; for (const i of issues) { const a = route(i); if (a) (by[a] ||= []).push(i.id); }
      return { assignments: Object.entries(by).map(([agent, issue_ids], n) => ({ agent, issue_ids, priority: n + 1, reason: "scripted" })), skipped: [], summary: "Scripted plan." };
    }
    if (name === "gbp") {
      const actions = [
        { type: "gbp_description", title: "Rewrite the profile description", content: `${facts.name} is a ${String(facts.googleCategory || "business").toLowerCase()} in ${area || "its area"}. Call ${facts.phone || "<FILL: phone>"} or visit us at ${facts.address}. <FILL: services offered and what to expect on a first visit>`, rationale: "Profile description is thin; uses verified details only.", issue_ids: ids.slice(0, 1) },
        { type: "review_requests", title: "Review-request kit for the front desk", content: `Hi! Thanks for visiting ${facts.name}. If you were happy with your visit, a short Google review helps others find us: <FILL: review link>`, rationale: "Review volume is below nearby competitors.", issue_ids: ids.slice(0, 1) },
      ];
      if (includeBadDraft) actions.push({ type: "gbp_post", title: "Launch post", content: `We are the best clinic in town with 20 years of experience and 5,000 happy patients. 100% guaranteed results!`, rationale: "Attract customers.", issue_ids: ids.slice(0, 1) });
      return { actions, notes: "scripted", needs_owner_input: ["services offered", "review link"] };
    }
    if (name === "seo") return { edits: [
      { op: "set_title", value: `${facts.name} | ${facts.googleCategory || "Local business"} in ${area}`.slice(0, 68), html: "", rationale: "Name + what it is + area.", issue_ids: ids.slice(0, 1) },
      { op: "set_meta_description", value: `${facts.name}, ${facts.address}. Call ${facts.phone || "us"} for opening hours and appointments.`.slice(0, 165), html: "", rationale: "Adds a description with verified contact details.", issue_ids: ids.slice(0, 1) },
    ], notes: "scripted", needs_owner_input: [] };
    if (name === "geo") {
      const ld = { "@context": "https://schema.org", "@type": "LocalBusiness", name: facts.name, address: facts.address, ...(facts.phone ? { telephone: facts.phone } : {}), ...(facts.location ? { geo: { "@type": "GeoCoordinates", latitude: facts.location.lat, longitude: facts.location.lng } } : {}), ...(facts.googleMapsUrl ? { hasMap: facts.googleMapsUrl } : {}), ...(facts.website ? { url: facts.website } : {}) };
      return { edits: [{ op: "add_jsonld", value: JSON.stringify(ld), html: "", rationale: "LocalBusiness schema from verified facts.", issue_ids: ids.slice(0, 1) }], notes: "scripted", needs_owner_input: [] };
    }
    if (name === "aeo") {
      const qa = [[`Where is ${facts.name}?`, `${facts.name} is at ${facts.address}.`], [`How do I contact ${facts.name}?`, facts.phone ? `Call ${facts.phone}.` : "<FILL: contact details>"], [`What are the opening hours?`, (facts.openingHours || ["<FILL: opening hours>"]).join("; ") + "."]];
      const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
      return { edits: [
        { op: "add_section_html", value: "", html: `<h2>Frequently asked questions</h2>${qa.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}`, rationale: "Question-led answers an assistant can quote.", issue_ids: ids.slice(0, 1) },
        { op: "add_jsonld", value: JSON.stringify(ld), html: "", rationale: "FAQPage schema matching the visible answers.", issue_ids: ids.slice(0, 1) },
      ], notes: "scripted", needs_owner_input: [] };
    }
    if (name === "reviewer") {
      const items = JSON.parse(prompt.slice(prompt.indexOf("[")));
      return { verdicts: items.map((i) => ({ id: i.id, status: "approve", problems: [], unsupported_claims: [] })) }; // lenient on purpose
    }
    throw new Error(`mock has no script for agent "${name}"`);
  };
}
