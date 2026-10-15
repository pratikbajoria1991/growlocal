// Pure helpers, safe to import from client components.

// Owner-facing question list: the crew phrases the same need several ways
// ("Opening hours", "Opening hours for each day…"). Keep one of each, drop
// what the owner already answered, and keep it short.
const STOP = new Set(["the", "for", "and", "each", "list", "any", "that", "your", "provide", "please", "confirm", "confirmation", "exact", "specific", "offered", "week"]);
const words = (s) =>
  new Set(
    String(s)
      .toLowerCase()
      .replace(/\(.*?\)|e\.g\..*$/g, " ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );

// Same question when every word of the shorter one appears in the other and
// they mostly overlap. "Consulting dermatologist" vs "consulting
// gynaecologist" stay separate: each has a word the other lacks.
const sameAsk = (a, b) => {
  const x = words(a), y = words(b);
  if (!x.size || !y.size) return false;
  const [small, big] = x.size <= y.size ? [x, y] : [y, x];
  for (const w of small) if (!big.has(w)) return false;
  return small.size / big.size >= 0.5;
};

export function tidyQuestions(questions, answered = []) {
  const kept = [];
  for (const q of questions || []) {
    if (answered.some((a) => sameAsk(q, a.q))) continue;
    const dup = kept.findIndex((k) => sameAsk(q, k));
    if (dup === -1) kept.push(q);
    else if (q.length < kept[dup].length && q.length > 12) kept[dup] = q; // prefer the plainer wording
  }
  return kept.slice(0, 8);
}
