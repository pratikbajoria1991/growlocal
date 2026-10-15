// Safe, structured website edits. Agents never emit free-form HTML for the
// whole page — they emit a short list of typed edits that this module
// validates and applies to a copy of the page in memory. The same function
// produces the "before/after" audit that proves a fix works, and the patch the
// owner (or we, with access) can apply for real.

export const EDIT_OPS = ["set_title", "set_meta_description", "set_canonical", "add_jsonld", "add_section_html"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// JSON inside a <script> must not be able to close the tag.
const safeJson = (s) => s.replace(/</g, "\\u003c");

// Page content we inject comes from a model, so it is treated as untrusted:
// no scripts, no event handlers, no frames, no javascript: URLs.
export function sanitizeHtml(html) {
  return String(html)
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|form|base)\b[\s\S]*?(<\/\s*\1\s*>|$)/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|form|base)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "$1=$2#$2");
}

function upsertHeadTag(html, regex, tag) {
  if (regex.test(html)) return html.replace(regex, tag);
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${tag}\n</head>`);
  return `${tag}\n${html}`;
}

/**
 * @param {string} html page source
 * @param {{op: string, value?: string, html?: string, rationale?: string}[]} edits
 * @param {{origin?: string}} opts origin of the site; canonical must match it
 * @returns {{html: string, applied: object[], rejected: {edit: object, reason: string}[]}}
 */
export function applyEdits(html, edits, { origin } = {}) {
  let out = String(html);
  const applied = [], rejected = [];
  const reject = (edit, reason) => rejected.push({ edit, reason });

  for (const edit of edits || []) {
    const op = edit?.op;
    const v = typeof edit?.value === "string" ? edit.value.trim() : "";
    if (!EDIT_OPS.includes(op)) { reject(edit, "unknown op"); continue; }

    if (op === "set_title") {
      if (!v || v.length > 70) { reject(edit, "title must be 1-70 characters"); continue; }
      out = upsertHeadTag(out, /<title[^>]*>[\s\S]*?<\/title>/i, `<title>${esc(v)}</title>`);
    } else if (op === "set_meta_description") {
      if (!v || v.length > 170) { reject(edit, "meta description must be 1-170 characters"); continue; }
      out = upsertHeadTag(out, /<meta[^>]+name=["']description["'][^>]*>/i, `<meta name="description" content="${esc(v)}">`);
    } else if (op === "set_canonical") {
      let u; try { u = new URL(v); } catch { reject(edit, "canonical is not a URL"); continue; }
      if (origin && u.origin !== origin) { reject(edit, "canonical must stay on the site's own origin"); continue; }
      out = upsertHeadTag(out, /<link[^>]+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${esc(u.href)}">`);
    } else if (op === "add_jsonld") {
      let obj; try { obj = JSON.parse(v); } catch { reject(edit, "JSON-LD is not valid JSON"); continue; }
      const t = obj?.["@type"];
      if (!obj?.["@context"] || !t) { reject(edit, "JSON-LD needs @context and @type"); continue; }
      // Replace an existing block of the same primary type instead of duplicating it.
      const primary = Array.isArray(t) ? t[0] : t;
      const re = new RegExp(`<script[^>]+application/ld\\+json[^>]*>(?:(?!</script>)[\\s\\S])*?"@type"\\s*:\\s*"${String(primary).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?</script>`, "i");
      const tag = `<script type="application/ld+json" data-growlocal="1">${safeJson(JSON.stringify(obj))}</script>`;
      out = re.test(out) ? out.replace(re, tag) : upsertHeadTag(out, /$^/, tag);
    } else if (op === "add_section_html") {
      const body = sanitizeHtml(edit.html || v);
      if (!body.trim() || body.length > 20000) { reject(edit, "section is empty or over 20,000 characters"); continue; }
      const block = `<section data-growlocal="1">\n${body}\n</section>`;
      out = /<\/body>/i.test(out) ? out.replace(/<\/body>/i, `${block}\n</body>`) : `${out}\n${block}`;
    }
    applied.push(edit);
  }
  return { html: out, applied, rejected };
}

// Short human-readable diff for the owner / operator.
export function describeEdits(applied) {
  return applied.map((e) => {
    if (e.op === "set_title") return `Title -> "${e.value}"`;
    if (e.op === "set_meta_description") return `Meta description -> "${e.value}"`;
    if (e.op === "set_canonical") return `Canonical -> ${e.value}`;
    if (e.op === "add_jsonld") { try { return `Schema: ${JSON.parse(e.value)["@type"]}`; } catch { return "Schema block"; } }
    return `Add content section (${(e.html || e.value || "").length} chars)`;
  });
}
