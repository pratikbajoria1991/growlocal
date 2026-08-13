"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Package, ArrowLeft, Copy, Check, Plus, Trash2, Download, ShieldCheck } from "lucide-react";
import { BUSINESS_TYPES, buildLocalBusinessSchema, buildFaqSchema } from "@/lib/tools";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SchemaGenerator() {
  const [f, setF] = useState({
    type: "LocalBusiness", name: "", description: "", url: "", telephone: "", email: "",
    street: "", locality: "", region: "", postalCode: "", country: "IN",
    latitude: "", longitude: "", priceRange: "", image: "", areaServed: "", sameAs: "",
    opens: "09:00", closes: "18:00",
    days: { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false, Sunday: false },
  });
  const [faqs, setFaqs] = useState([{ q: "", a: "" }]);
  const [tab, setTab] = useState("business");

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const toggleDay = (d) => setF((s) => ({ ...s, days: { ...s.days, [d]: !s.days[d] } }));

  const businessSchema = useMemo(() => buildLocalBusinessSchema(f), [f]);
  const faqSchema = useMemo(() => buildFaqSchema(faqs), [faqs]);

  const output = useMemo(() => {
    const blocks = [];
    if (f.name) blocks.push(businessSchema);
    if (faqSchema) blocks.push(faqSchema);
    if (!blocks.length) return "";
    return blocks
      .map((b) => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`)
      .join("\n\n");
  }, [businessSchema, faqSchema, f.name]);

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 pb-20">
      <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-forest-900/50 hover:text-forest-900 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All tools
      </Link>

      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(56,189,248,0.15)" }}>
        <Package className="w-5 h-5" style={{ color: "#38bdf8" }} aria-hidden="true" />
      </div>

      <h1 className="font-display text-3xl sm:text-4xl leading-[1.05] tracking-[-0.03em] mb-4 text-balance">
        Generate the schema you&apos;re missing
      </h1>
      <p className="text-forest-900/65 leading-relaxed mb-4 max-w-2xl text-pretty">
        Fill in your details and get valid JSON-LD to paste into your page&apos;s <code className="text-sm font-mono bg-forest-900/5 px-1.5 py-0.5 rounded">&lt;head&gt;</code>.
        LocalBusiness schema is the single highest-impact fix for local visibility.
      </p>
      <p className="inline-flex items-center gap-1.5 text-xs text-forest-900/50 mb-9">
        <ShieldCheck className="w-3.5 h-3.5 text-lime-600" aria-hidden="true" />
        Runs entirely in your browser — nothing you type is sent to a server.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div>
          <div role="tablist" className="flex gap-1 mb-5 p-1 rounded-xl bg-forest-900/[0.04]">
            {[["business", "Business"], ["faq", `FAQ${faqs.filter((x) => x.q && x.a).length ? ` (${faqs.filter((x) => x.q && x.a).length})` : ""}`]].map(([id, label]) => (
              <button
                key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-white shadow-sm text-forest-900" : "text-forest-900/50 hover:text-forest-900/75"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "business" ? (
            <div className="space-y-4">
              <Field label="Business type" hint="Pick the most specific one that fits — it matters more than you'd think.">
                <select value={f.type} onChange={(e) => set("type", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-white outline-none focus:border-lime-500/60 text-sm transition-colors">
                  {BUSINESS_TYPES.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.types.map((t) => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Field>

              <Field label="Business name" required>
                <Input value={f.name} onChange={(v) => set("name", v)} placeholder="Park Street Dental" />
              </Field>

              <Field label="Description" hint="One or two sentences. What you do, for whom.">
                <textarea rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Family dental clinic offering implants, root canals and orthodontics." suppressHydrationWarning className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-white outline-none focus:border-lime-500/60 text-sm leading-relaxed resize-y transition-colors" />
              </Field>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Website"><Input value={f.url} onChange={(v) => set("url", v)} placeholder="https://example.com" /></Field>
                <Field label="Phone" hint="Full international format."><Input value={f.telephone} onChange={(v) => set("telephone", v)} placeholder="+91-98765-43210" /></Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Email"><Input value={f.email} onChange={(v) => set("email", v)} placeholder="hello@example.com" /></Field>
                <Field label="Price range"><Input value={f.priceRange} onChange={(v) => set("priceRange", v)} placeholder="₹₹" /></Field>
              </div>

              <Divider>Address</Divider>
              <Field label="Street address" hint="Must match your Google Business Profile character for character.">
                <Input value={f.street} onChange={(v) => set("street", v)} placeholder="12 Park Street" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="City"><Input value={f.locality} onChange={(v) => set("locality", v)} placeholder="Kolkata" /></Field>
                <Field label="State / region"><Input value={f.region} onChange={(v) => set("region", v)} placeholder="West Bengal" /></Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Postal code"><Input value={f.postalCode} onChange={(v) => set("postalCode", v)} placeholder="700016" /></Field>
                <Field label="Country code"><Input value={f.country} onChange={(v) => set("country", v)} placeholder="IN" /></Field>
              </div>

              <Divider>Location</Divider>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Latitude"><Input value={f.latitude} onChange={(v) => set("latitude", v)} placeholder="22.5405" /></Field>
                <Field label="Longitude"><Input value={f.longitude} onChange={(v) => set("longitude", v)} placeholder="88.3648" /></Field>
              </div>
              <p className="text-xs text-forest-900/45 -mt-1">Right-click your exact spot in Google Maps to copy coordinates.</p>

              <Field label="Areas served" hint="Comma-separated. Every locality you serve, not just where you sit.">
                <Input value={f.areaServed} onChange={(v) => set("areaServed", v)} placeholder="Ballygunge, Gariahat, Park Street" />
              </Field>

              <Divider>Opening hours</Divider>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d) => (
                  <button
                    key={d} type="button" onClick={() => toggleDay(d)} aria-pressed={f.days[d]}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${f.days[d] ? "bg-forest-900 text-canvas-50" : "bg-forest-900/[0.05] text-forest-900/45 hover:bg-forest-900/10"}`}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Opens"><Input type="time" value={f.opens} onChange={(v) => set("opens", v)} /></Field>
                <Field label="Closes"><Input type="time" value={f.closes} onChange={(v) => set("closes", v)} /></Field>
              </div>

              <Divider>Profiles</Divider>
              <Field label="Social / profile URLs" hint="One per line. Links your entity across the web.">
                <textarea rows={3} value={f.sameAs} onChange={(e) => set("sameAs", e.target.value)} placeholder={"https://www.facebook.com/yourpage\nhttps://www.instagram.com/yourpage"} suppressHydrationWarning className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-white outline-none focus:border-lime-500/60 text-sm leading-relaxed resize-y transition-colors" />
              </Field>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-forest-900/60 leading-relaxed">
                FAQPage schema is the highest-impact AEO change available. Add the questions customers genuinely ask —
                and make sure these same questions appear visibly on the page, or Google treats it as a violation.
              </p>
              {faqs.map((pair, i) => (
                <div key={i} className="rounded-2xl border hairline bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-forest-900/50">Question {i + 1}</span>
                    {faqs.length > 1 && (
                      <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} className="text-forest-900/30 hover:text-rose-500 transition-colors" aria-label={`Remove question ${i + 1}`}>
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <Input value={pair.q} onChange={(v) => setFaqs(faqs.map((p, j) => j === i ? { ...p, q: v } : p))} placeholder="How much does a consultation cost?" />
                  <textarea
                    rows={2} value={pair.a}
                    onChange={(e) => setFaqs(faqs.map((p, j) => j === i ? { ...p, a: e.target.value } : p))}
                    placeholder="A first consultation costs ₹500 and takes about 30 minutes."
                    suppressHydrationWarning
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl border hairline bg-canvas-50 outline-none focus:border-lime-500/60 text-sm leading-relaxed resize-y transition-colors"
                  />
                  {pair.a && (
                    <p className={`text-[11px] mt-1.5 ${pair.a.length >= 150 && pair.a.length <= 250 ? "text-lime-700" : "text-forest-900/40"}`}>
                      {pair.a.length} chars {pair.a.length >= 150 && pair.a.length <= 250 ? "· ideal length" : "· aim for 150-250"}
                    </p>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setFaqs([...faqs, { q: "", a: "" }])} className="w-full py-2.5 rounded-xl border border-dashed border-forest-900/15 text-sm text-forest-900/55 hover:border-lime-500/50 hover:text-forest-900 inline-flex items-center justify-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add question
              </button>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OutputPanel output={output} hasName={Boolean(f.name)} />
        </div>
      </div>
    </div>
  );
}

function OutputPanel({ output, hasName }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function download() {
    const blob = new Blob([output], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "schema.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="rounded-4xl bg-forest-900 text-canvas-50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-canvas-50/10">
        <span className="text-[11px] uppercase tracking-[0.15em] text-canvas-50/45">Your JSON-LD</span>
        {output && (
          <div className="flex gap-1.5">
            <button onClick={copy} className="px-2.5 py-1.5 rounded-lg bg-canvas-50/10 hover:bg-canvas-50/20 text-xs inline-flex items-center gap-1.5 transition-colors">
              {copied ? <><Check className="w-3 h-3" aria-hidden="true" /> Copied</> : <><Copy className="w-3 h-3" aria-hidden="true" /> Copy</>}
            </button>
            <button onClick={download} className="px-2.5 py-1.5 rounded-lg bg-canvas-50/10 hover:bg-canvas-50/20 text-xs inline-flex items-center gap-1.5 transition-colors">
              <Download className="w-3 h-3" aria-hidden="true" /> Save
            </button>
          </div>
        )}
      </div>

      {output ? (
        <>
          <pre className="p-5 text-[11px] font-mono leading-relaxed overflow-auto max-h-[32rem] text-canvas-50/85 whitespace-pre-wrap">{output}</pre>
          <div className="px-5 py-4 border-t border-canvas-50/10 text-xs text-canvas-50/55 leading-relaxed">
            Paste this into your page&apos;s <code className="font-mono">&lt;head&gt;</code>, then validate at{" "}
            <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-lime-400 underline">
              Google&apos;s Rich Results Test
            </a>.
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-sm text-canvas-50/40 leading-relaxed">
          {hasName ? "Fill in a few more fields…" : "Enter your business name to start generating."}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-xs text-forest-900/60 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-forest-900/40 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} suppressHydrationWarning
      className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-white outline-none focus:border-lime-500/60 text-sm transition-colors"
    />
  );
}

function Divider({ children }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35">{children}</span>
      <span className="flex-1 h-px bg-forest-900/[0.07]" />
    </div>
  );
}
