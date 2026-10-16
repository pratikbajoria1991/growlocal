"use client";
// Owner onboarding: the verified facts our agents may use, how much can ship
// without asking, and the owner's permission to act. Saves to
// /api/owner/onboarding; can be saved half-done and finished later.
import { useState } from "react";
import Link from "next/link";
import { Loader2, Check, Plus, X, AlertCircle, ShieldCheck } from "lucide-react";
import { normalizeOnboarding, onboardingProgress, AUTO_OPTIONS, ALWAYS_ASK } from "@/lib/onboarding";

const field = "w-full px-3.5 py-2.5 rounded-xl border hairline bg-white outline-none focus:border-indigo-500/60 text-[16px]";
const blank = { services: { name: "", price: "" }, team: { name: "", role: "", credentials: "" }, faqs: { q: "", a: "" } };
const withRows = (o) => ({
  ...o,
  services: o.services.length ? o.services : [blank.services, blank.services, blank.services],
  team: o.team.length ? o.team : [blank.team],
  faqs: o.faqs.length ? o.faqs : Array.from({ length: 5 }, () => blank.faqs),
});

export function OnboardingForm({ clientId, businessName, initial, initialConsent }) {
  const [o, setO] = useState(() => withRows(normalizeOnboarding(initial || {})));
  const [consent, setConsent] = useState({ posting: !!initialConsent?.posting, data: !!initialConsent?.data });
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const progress = onboardingProgress(o, consent);

  const up = (k, v) => { setO((p) => ({ ...p, [k]: v })); setState(null); };
  const upRow = (k, i, f, v) => up(k, o[k].map((r, j) => (j === i ? { ...r, [f]: v } : r)));
  const addRow = (k) => up(k, [...o[k], blank[k]]);
  const delRow = (k, i) => up(k, o[k].filter((_, j) => j !== i));

  async function save(e) {
    e?.preventDefault();
    setState("saving"); setError(null);
    try {
      const r = await fetch("/api/owner/onboarding", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, data: o, consent }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't save. Please try again.");
      setState("saved");
    } catch (err) { setError(err.message); setState(null); }
  }

  return (
    <form onSubmit={save} className="pb-28">
      {/* Progress */}
      <div className="rounded-3xl bg-forest-900 text-canvas-50 p-6 mb-8">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div className="font-display font-bold text-xl tracking-[-0.03em]">Setup {progress.pct}% complete</div>
          <div className="text-sm text-canvas-50/70 tabular-nums">{progress.done} of {progress.total}</div>
        </div>
        <div className="h-2 rounded-full bg-canvas-50/15 overflow-hidden mb-4" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
          <div className="h-full bg-brand transition-all" style={{ width: `${progress.pct}%` }} />
        </div>
        {progress.missing.length > 0 ? (
          <p className="text-sm text-canvas-50/75">Still needed: {progress.missing.map((m) => m.label).join(" · ")}</p>
        ) : (
          <p className="text-sm text-brand">Everything we need. Save, and our team takes it from here.</p>
        )}
      </div>

      <p className="text-forest-900/75 leading-relaxed mb-8">
        Our agents only say what they can prove: your live Google data, or what you tell us here. Anything you leave out, they leave out rather than guess.
        Save at any point and come back later.
      </p>

      <Section n="1" title="Your goal">
        <Label t="What do you most want more of in the next three months?" hint="e.g. more calls for root canal treatment, more showroom visits for bridal jewellery">
          <input className={field} value={o.goal} onChange={(e) => up("goal", e.target.value)} />
        </Label>
      </Section>

      <Section n="2" title="The basics">
        <Label t="Opening hours" hint="e.g. Mon to Sat 10am to 8pm, Sunday 11am to 2pm">
          <textarea className={field} rows={2} value={o.hours} onChange={(e) => up("hours", e.target.value)} />
        </Label>
        <Label t="Holiday closures (optional)">
          <input className={field} value={o.holidays} onChange={(e) => up("holidays", e.target.value)} />
        </Label>
        <Label t="Areas you serve" hint="Neighbourhoods or towns customers come from, comma-separated">
          <input className={field} value={o.serviceAreas} onChange={(e) => up("serviceAreas", e.target.value)} />
        </Label>
      </Section>

      <Section n="3" title="Services and team">
        <div className="text-sm font-medium mb-2">Services <span className="font-normal text-forest-900/65">(at least 3; price is optional)</span></div>
        <div className="space-y-2 mb-3">
          {o.services.map((r, i) => (
            <Row key={i} onRemove={o.services.length > 1 ? () => delRow("services", i) : null}>
              <input aria-label={`Service ${i + 1}`} placeholder="Service" className={`${field} sm:flex-[2]`} value={r.name} onChange={(e) => upRow("services", i, "name", e.target.value)} />
              <input aria-label={`Price for service ${i + 1}`} placeholder="Price or range (optional)" className={`${field} sm:flex-1`} value={r.price} onChange={(e) => upRow("services", i, "price", e.target.value)} />
            </Row>
          ))}
        </div>
        <AddBtn onClick={() => addRow("services")} label="Add a service" />

        <div className="text-sm font-medium mt-7 mb-2">Team <span className="font-normal text-forest-900/65">(optional; for clinics, list doctors with qualifications)</span></div>
        <div className="space-y-2 mb-3">
          {o.team.map((r, i) => (
            <Row key={i} onRemove={() => delRow("team", i)}>
              <input aria-label={`Team member ${i + 1} name`} placeholder="Name" className={`${field} sm:flex-1`} value={r.name} onChange={(e) => upRow("team", i, "name", e.target.value)} />
              <input aria-label={`Team member ${i + 1} role`} placeholder="Role" className={`${field} sm:flex-1`} value={r.role} onChange={(e) => upRow("team", i, "role", e.target.value)} />
              <input aria-label={`Team member ${i + 1} qualifications`} placeholder="Qualifications, years of experience" className={`${field} sm:flex-[1.4]`} value={r.credentials} onChange={(e) => upRow("team", i, "credentials", e.target.value)} />
            </Row>
          ))}
        </div>
        <AddBtn onClick={() => addRow("team")} label="Add a person" />
      </Section>

      <Section n="4" title="What customers ask">
        <p className="text-sm text-forest-900/70 mb-4">
          Your real answers to the questions you hear most. These become the answers Google and AI assistants can quote. Aim for at least 5.
        </p>
        <div className="space-y-3 mb-3">
          {o.faqs.map((r, i) => (
            <div key={i} className="rounded-2xl border hairline bg-canvas-50 p-3 relative">
              <input aria-label={`Question ${i + 1}`} placeholder={`Question ${i + 1}`} className={`${field} mb-2 pr-10`} value={r.q} onChange={(e) => upRow("faqs", i, "q", e.target.value)} />
              <textarea aria-label={`Answer ${i + 1}`} placeholder="Your answer" rows={2} className={field} value={r.a} onChange={(e) => upRow("faqs", i, "a", e.target.value)} />
              {o.faqs.length > 1 && (
                <button type="button" onClick={() => delRow("faqs", i)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-forest-900/5" aria-label={`Remove question ${i + 1}`}><X className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
        <AddBtn onClick={() => addRow("faqs")} label="Add a question" />
        <Label t="What makes you different?" hint="Awards, equipment, insurance or cashless tie-ups, languages spoken, parking: only what's true">
          <textarea className={`${field} mt-6`} rows={3} value={o.highlights} onChange={(e) => up("highlights", e.target.value)} />
        </Label>
        <Label t="Competitors you watch (optional)" hint="3 to 5 names">
          <input className={field} value={o.competitors} onChange={(e) => up("competitors", e.target.value)} />
        </Label>
      </Section>

      <Section n="5" title="How you sound, and what we never say">
        <Label t="Tone of voice (optional)" hint="e.g. warm and simple, formal, friendly with a little humour">
          <input className={field} value={o.tone} onChange={(e) => up("tone", e.target.value)} />
        </Label>
        <Label t="Things we must never say or claim" hint="e.g. guaranteed results, before-and-after claims, competitor names, discounts">
          <textarea className={field} rows={2} value={o.avoid} onChange={(e) => up("avoid", e.target.value)} />
        </Label>
      </Section>

      <Section n="6" title="Approvals">
        <div className="text-sm font-medium mb-2">These can go live without asking you each time</div>
        <div className="space-y-2 mb-5">
          {AUTO_OPTIONS.map(([k, label]) => (
            <label key={k} className="flex items-start gap-3 text-[15px] cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-[#15803d]" checked={o.auto[k]} onChange={(e) => up("auto", { ...o.auto, [k]: e.target.checked })} />
              {label}
            </label>
          ))}
        </div>
        <div className="rounded-2xl bg-sage-50 border hairline p-4 text-sm mb-6">
          <div className="font-medium mb-1.5 inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-indigo-600" aria-hidden="true" /> Always waits for your OK</div>
          <ul className="list-disc pl-5 space-y-0.5 text-forest-900/75">{ALWAYS_ASK.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <fieldset className="mb-6">
          <legend className="text-sm font-medium mb-2">Negative reviews (1 to 3 stars)</legend>
          {[["draft", "Draft a reply and send it to me to approve"], ["alert", "Just alert me; I'll reply myself"]].map(([v, t]) => (
            <label key={v} className="flex items-center gap-3 text-[15px] mb-1.5 cursor-pointer">
              <input type="radio" name="neg" className="w-4 h-4 accent-[#15803d]" checked={o.negativeReviews === v} onChange={() => up("negativeReviews", v)} /> {t}
            </label>
          ))}
        </fieldset>
        <div className="text-sm font-medium mb-2">Who approves changes</div>
        <div className="grid sm:grid-cols-3 gap-2">
          <input aria-label="Approver name" placeholder="Name" className={field} value={o.approver.name} onChange={(e) => up("approver", { ...o.approver, name: e.target.value })} />
          <input aria-label="Approver WhatsApp number" placeholder="WhatsApp number" inputMode="tel" className={field} value={o.approver.whatsapp} onChange={(e) => up("approver", { ...o.approver, whatsapp: e.target.value })} />
          <input aria-label="Approver email" placeholder="Email" type="email" className={field} value={o.approver.email} onChange={(e) => up("approver", { ...o.approver, email: e.target.value })} />
        </div>
      </Section>

      <Section n="7" title="Your permission">
        <label className="flex items-start gap-3 text-[15px] mb-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-[#15803d]" checked={consent.posting} onChange={(e) => { setConsent({ ...consent, posting: e.target.checked }); setState(null); }} />
          <span>I authorise Growlocal to update {businessName}&apos;s Google Business Profile and website, and reply to reviews, within the approval settings above. I can withdraw this at any time.</span>
        </label>
        <label className="flex items-start gap-3 text-[15px] cursor-pointer">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-[#15803d]" checked={consent.data} onChange={(e) => { setConsent({ ...consent, data: e.target.checked }); setState(null); }} />
          <span>I agree that Growlocal may process the business and staff details given here to deliver the service, as described in the <Link href="/privacy" className="underline">privacy policy</Link>.</span>
        </label>
      </Section>

      {/* Save bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t hairline bg-canvas-50/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-3">
          <div className="text-sm min-w-0" aria-live="polite">
            {error ? <span className="text-rose-700 inline-flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" />{error}</span>
              : state === "saved" ? <span className="text-indigo-700 inline-flex items-center gap-1.5"><Check className="w-4 h-4" />Saved</span>
              : <span className="text-forest-900/65">{progress.pct}% complete</span>}
          </div>
          <button disabled={state === "saving"} className="min-h-[44px] px-6 btn-premium text-sm inline-flex items-center gap-2 disabled:opacity-50 shrink-0">
            {state === "saving" && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ n, title, children }) {
  return (
    <section className="rounded-3xl bg-white border hairline p-6 sm:p-8 mb-5">
      <h2 className="font-display font-bold text-xl tracking-[-0.03em] mb-5 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-brand/25 text-indigo-800 text-sm flex items-center justify-center tabular-nums" aria-hidden="true">{n}</span>{title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Label({ t, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{t}</span>
      {hint && <span className="block text-xs text-forest-900/65 mb-1.5">{hint}</span>}
      {children}
    </label>
  );
}
function Row({ children, onRemove }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} className="self-end sm:self-auto p-2 rounded-lg hover:bg-forest-900/5 shrink-0" aria-label="Remove row"><X className="w-4 h-4" /></button>
      ) : <span className="hidden sm:block w-8 shrink-0" />}
    </div>
  );
}
function AddBtn({ onClick, label }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 px-3 py-2 rounded-full hover:bg-brand/15">
      <Plus className="w-4 h-4" aria-hidden="true" /> {label}
    </button>
  );
}
