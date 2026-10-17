import Link from "next/link";
import { ArrowRight, Check, Clock, ShieldCheck, MessageCircle, UserCheck, Ban, Wrench, ClipboardList, LineChart, Search, MapPin, Bot, Star, ListChecks } from "lucide-react";
import { BRAND, PLANS, AUTONOMY, HOW_IT_WORKS } from "@/lib/brand";
import { JsonLd, webPageSchema, breadcrumbSchema, howToSchema, faqSchema } from "@/lib/schema";
import { FaqSection } from "@/components/FaqSection";
import { MANAGED_FAQ } from "@/lib/page-faq";
import { WaitlistForm } from "@/components/WaitlistForm";
import { getProposal } from "@/lib/proposal";
import { getPreview } from "@/lib/site-preview";

const TITLE = "Growlocal Managed: local marketing done for you";
const DESCRIPTION =
  "We run your Google Business Profile, review replies, website SEO and AI search visibility every week. You approve what matters on WhatsApp. No agency.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BRAND.url}/managed` },
};

const STEP_ICONS = [Search, ClipboardList, Wrench, LineChart];

// The comparison is about how the work is bought and proven, not a claim
// about any particular agency's quality.
// What the owner's dashboard shows every week. Keep each line true to what's measured.
const TRACKED = [
  { icon: MapPin, t: "Your map ranking, street by street", d: "Each keyword is searched on Google Maps from a grid of points around your business, so you see where you rank in your neighbourhood, not just at your front door." },
  { icon: Bot, t: "Whether AI names you", d: "Each week we ask Google's AI, searching the web, for the best in your area, record whether you're named, and note the sites it relied on." },
  { icon: Star, t: "Your reviews over time", d: "Rating and review count week by week, and your latest reviews in one place." },
  { icon: ListChecks, t: "Every directory listing", d: "We submit your listings, check that live ones show your correct name and phone, and fix the ones that don't. You see each listing's status." },
];

const COMPARE = [
  ["Who does the work", "An account manager, often juggling many clients", "Our team with AI, on a fixed weekly plan"],
  ["What you see", "A report of what they did", "Every change logged, with your Google numbers before and after"],
  ["Risky changes", "Varies", "Never made without your OK"],
  ["Commitment", "Often a long retainer", "Month to month"],
  ["Where you talk to us", "Calls and email threads", "WhatsApp"],
];

export default async function Managed({ searchParams }) {
  const plan = PLANS.find((p) => p.id === "managed");
  // Arriving from a proposal: prefill the application with what we already know.
  const sp = await searchParams;
  const proposal = sp?.proposal ? await getProposal(sp.proposal) : null;
  const preview = !proposal && sp?.preview ? await getPreview(sp.preview) : null;

  return (
    <>
      <JsonLd data={webPageSchema({ path: "/managed", title: TITLE, description: DESCRIPTION })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Growlocal Managed", path: "/managed" }])} />
      <JsonLd data={faqSchema(MANAGED_FAQ)} />
      <JsonLd data={howToSchema({
        name: "How Growlocal manages your local marketing",
        description: "From a free audit to weekly work and a monthly results report.",
        steps: HOW_IT_WORKS,
      })} />

      <section className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/12 border border-indigo-500/25 text-xs text-indigo-700 font-medium mb-6">
            <UserCheck className="w-3 h-3" aria-hidden="true" /> Taking founding clients — limited slots
          </div>
          <h1 className="font-display text-4xl sm:text-6xl leading-[1.02] tracking-[-0.03em] mb-5 max-w-3xl text-balance">
            You don&apos;t need to hire a marketing agency. <span className="text-indigo-600">We&apos;ll handle it.</span>
          </h1>
          <p className="text-lg text-forest-900/65 mb-8 max-w-2xl leading-relaxed text-pretty">
            Growlocal Managed is a done-for-you local marketing service. Every week we update your Google Business Profile,
            reply to your reviews and fix your website so Google, Maps and AI assistants can recommend you. You approve
            only the changes that matter, on WhatsApp, and see the results in your own Google numbers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="#apply" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl btn-premium text-white font-medium">
              Apply for a founding slot <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <Link href="/proposal" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border hairline bg-white hover:bg-forest-900/[0.03] font-medium transition-colors">
              Get a free growth proposal
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">How it works</div>
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.03em] mb-10 max-w-2xl text-balance">
          How does Growlocal work?
        </h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((s, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={s.name} className="rounded-4xl border hairline bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/12 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  </div>
                  <span className="font-display text-2xl text-forest-900/15">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="font-display text-lg mb-2">{s.name}</h3>
                <p className="text-sm text-forest-900/60 leading-relaxed">{s.text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* The service contract */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">Who does what</div>
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.03em] mb-4 max-w-2xl text-balance">
          What needs my approval?
        </h2>
        <p className="text-forest-900/65 leading-relaxed mb-10 max-w-2xl text-pretty">
          Routine work just happens. Anything that could affect your listing or your reputation waits for a yes from you.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <ContractCard tone="ok" icon={Wrench} title="We just do it" items={AUTONOMY.weDo} />
          <ContractCard tone="ask" icon={MessageCircle} title="We ask you first" items={AUTONOMY.youApprove} />
          <ContractCard tone="no" icon={Ban} title="We never do it" items={AUTONOMY.weNever} />
        </div>
      </section>

      {/* What's tracked */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">Measured every week</div>
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.03em] mb-4 max-w-2xl text-balance">
          What will I see in my dashboard?
        </h2>
        <p className="text-forest-900/65 leading-relaxed mb-10 max-w-2xl text-pretty">
          Not a list of tasks we say we did. Measurements taken from Google every week, so you can see whether the work is moving you.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {TRACKED.map((x) => (
            <div key={x.t} className="rounded-4xl border hairline bg-white p-7">
              <span className="w-11 h-11 rounded-2xl bg-brand/20 flex items-center justify-center mb-5"><x.icon className="w-5 h-5 text-indigo-700" aria-hidden="true" /></span>
              <h3 className="font-display font-bold text-xl tracking-[-0.03em] mb-2">{x.t}</h3>
              <p className="text-forest-900/70 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compared with an agency */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">Compared with hiring an agency</div>
        <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-[-0.03em] mb-10 max-w-2xl text-balance">
          Why not just hire a local marketing agency?
        </h2>
        <div className="overflow-x-auto rounded-4xl border hairline bg-white">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b hairline text-left">
                <th className="p-4 font-medium text-forest-900/65 w-1/4"></th>
                <th className="p-4 font-medium text-forest-900/70">Typical agency</th>
                <th className="p-4 font-semibold text-indigo-700">Growlocal</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([row, agency, us]) => (
                <tr key={row} className="border-b hairline last:border-0 align-top">
                  <th scope="row" className="p-4 text-left font-medium">{row}</th>
                  <td className="p-4 text-forest-900/60 leading-relaxed">{agency}</td>
                  <td className="p-4 text-forest-900/85 leading-relaxed">{us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FaqSection items={MANAGED_FAQ} className="max-w-3xl mx-auto px-5 sm:px-8 py-16 border-t hairline" />

      {/* What you get + apply */}
      <section id="apply" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t hairline scroll-mt-24">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-4xl bg-forest-900 text-canvas-50 p-8 sm:p-10">
            <div className="text-[11px] uppercase tracking-[0.15em] text-indigo-400 mb-2">{plan.name}</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-display text-5xl">{plan.price}</span>
              <span className="text-sm text-canvas-50/75">{plan.cadence} + GST</span>
            </div>
            <p className="text-canvas-50/70 text-sm leading-relaxed mb-6">{plan.tagline}</p>
            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="text-sm flex items-start gap-2.5 text-canvas-50/85">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400" aria-hidden="true" /> {f}
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t border-canvas-50/15">
              <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-canvas-50/75 mb-2.5">Planned, not included yet</div>
              <ul className="space-y-2">
                {plan.planned.map((f) => (
                  <li key={f} className="text-xs flex items-start gap-2.5 text-canvas-50/75">
                    <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" aria-hidden="true" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-4xl border hairline bg-white p-8 sm:p-10">
            <h2 className="font-display text-2xl sm:text-3xl mb-3">Apply for a founding slot</h2>
            <p className="text-sm text-forest-900/60 leading-relaxed mb-6">
              We take on a small number of businesses at a time so the work stays hands-on. Tell us where to reach you —
              we&apos;ll look at your profile and website before we call, and there&apos;s nothing to pay until you decide to start.
            </p>
            {proposal && (
              <p className="text-sm rounded-xl bg-indigo-500/[0.06] border border-indigo-500/20 p-3 mb-4 leading-relaxed">
                Starting from your proposal for <strong>{proposal.place.name}</strong> — {proposal.tier.name} plan, {proposal.tier.price}/month.
              </p>
            )}
            {preview && (
              <p className="text-sm rounded-xl bg-indigo-500/[0.06] border border-indigo-500/20 p-3 mb-4 leading-relaxed">
                Claiming the preview website for <strong>{preview.name}</strong>. We&apos;ll confirm you own the business before anything goes live.
              </p>
            )}
            <WaitlistForm
              proposalId={proposal?.id}
              initial={proposal
                ? { business: proposal.place.name, site: proposal.place.website || proposal.place.mapsUri || "" }
                : preview ? { business: preview.name, site: preview.mapsUri || "", phone: "" } : undefined}
            />
            <div className="mt-6 pt-5 border-t hairline flex items-start gap-2.5 text-xs text-forest-900/70 leading-relaxed">
              <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600" aria-hidden="true" />
              We never ask for your Google password. You add us as a Manager on your Business Profile, and you can remove us from the same screen whenever you like.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ContractCard({ tone, icon: Icon, title, items }) {
  const styles = {
    ok: "border-emerald-500/25 bg-emerald-500/[0.04]",
    ask: "border-amber-500/30 bg-amber-500/[0.05]",
    no: "border-rose-500/20 bg-rose-500/[0.03]",
  }[tone];
  const iconColor = { ok: "text-emerald-600", ask: "text-amber-600", no: "text-rose-500" }[tone];
  return (
    <div className={`rounded-4xl border p-7 ${styles}`}>
      <Icon className={`w-5 h-5 mb-3 ${iconColor}`} aria-hidden="true" />
      <h3 className="font-display text-xl mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((t) => (
          <li key={t} className="text-sm text-forest-900/75 leading-relaxed flex items-start gap-2">
            <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${iconColor.replace("text-", "bg-")}`} aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
