// Pure ledger definitions — no store, no Node APIs — so both server code and
// client components (the console, the owner dashboard) can import them.

// Autonomy is tiered by how badly a change can go wrong, not by how much
// effort it is. Editing a GBP name, category or address can trigger Google
// re-verification or suspension; a reply on a clinic review can leak that
// someone is a patient. Those always wait for the owner.
export const ACTION_TYPES = {
  gbp_post:         { label: "GBP post",                      surface: "gbp",       risk: "auto" },
  gbp_photos:       { label: "GBP photos",                    surface: "gbp",       risk: "auto" },
  gbp_services:     { label: "GBP services / products",       surface: "gbp",       risk: "auto" },
  gbp_attributes:   { label: "GBP attributes",                surface: "gbp",       risk: "auto" },
  gbp_hours:        { label: "GBP hours",                     surface: "gbp",       risk: "approval" },
  gbp_links:        { label: "GBP website / phone link",      surface: "gbp",       risk: "approval" },
  gbp_description:  { label: "GBP description",               surface: "gbp",       risk: "approval" },
  gbp_identity:     { label: "GBP name / category / address", surface: "gbp",       risk: "approval" },
  review_reply:     { label: "Review reply (positive)",       surface: "reviews",   risk: "auto" },
  review_requests:  { label: "Review request kit",            surface: "reviews",   risk: "auto" },
  review_sensitive: { label: "Review reply (negative or health-related)", surface: "reviews", risk: "approval" },
  site_schema:      { label: "Website schema / FAQ",          surface: "website",   risk: "auto" },
  site_technical:   { label: "Website technical / local fixes", surface: "website", risk: "auto" },
  site_page:        { label: "Website page change",           surface: "website",   risk: "approval" },
  site_blog:        { label: "Website article",               surface: "website",   risk: "approval" },
  citation:         { label: "Directory listing",             surface: "citations", risk: "auto" },
  other:            { label: "Other",                         surface: "other",     risk: "approval" },
};

export const STATUS_LABELS = {
  planned: "Planned",
  awaiting_approval: "Needs owner's OK",
  approved: "Approved",
  declined: "Declined",
  done: "Done",
};

// Follow-up windows after an action ships. Insights data moves slowly and
// noisily, so a single "after" reading proves nothing — three do better.
export const CHECKPOINTS = [7, 28, 56];

// The four numbers GBP Performance reports that an owner actually cares about.
export const METRICS = [
  ["calls", "Calls"],
  ["directions", "Direction requests"],
  ["websiteClicks", "Website clicks"],
  ["views", "Profile views"],
];

// Follow-ups that are due and not yet recorded — the operator's to-do list
// for the Verify layer.
export function dueCheckpoints(action, today = new Date()) {
  if (action.status !== "done" || !action.doneAt) return [];
  const age = Math.floor((today - new Date(action.doneAt)) / 86400000);
  const have = new Set((action.followups || []).map((f) => f.day));
  return CHECKPOINTS.filter((d) => age >= d && !have.has(d));
}

// Change vs baseline for the latest follow-up. Returns null when there's no
// like-for-like comparison, rather than inventing one.
export function latestDelta(action) {
  const b = action.baseline;
  const last = (action.followups || []).at(-1);
  if (!b || !last) return null;
  if (b.periodDays !== last.metrics.periodDays) return { comparable: false, day: last.day };

  const rows = [];
  for (const [k, label] of METRICS) {
    if (b[k] == null || last.metrics[k] == null) continue;
    const diff = last.metrics[k] - b[k];
    rows.push({
      key: k,
      label,
      before: b[k],
      after: last.metrics[k],
      diff,
      pct: b[k] > 0 ? Math.round((diff / b[k]) * 100) : null,
    });
  }
  return { comparable: true, day: last.day, periodDays: b.periodDays, rows };
}
