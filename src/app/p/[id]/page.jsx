import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, MapPin, Star, ExternalLink, Wrench, MessageCircle, HandHelping, Info } from "lucide-react";
import { getProposal, HANDLED_BY } from "@/lib/proposal";
import { PLANS } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getProposal(id);
  return {
    title: p ? `Growth proposal — ${p.place.name}` : "Proposal not found",
    // Private-by-link: a business's gaps are not something to index.
    robots: { index: false, follow: false },
  };
}

const HANDLED_ICON = { we_do: Wrench, you_approve: MessageCircle, you_help: HandHelping };
const HANDLED_TONE = {
  we_do: "bg-emerald-500/12 text-emerald-700",
  you_approve: "bg-amber-500/15 text-amber-700",
  you_help: "bg-indigo-500/12 text-indigo-700",
};

const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtDistance = (m) => (m == null ? "—" : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);

export default async function ProposalPage({ params }) {
  const { id } = await params;
  const p = await getProposal(id);
  if (!p) notFound();

  const managed = PLANS.find((x) => x.id === "managed");
  const rows = [
    { ...p.self, name: p.place.name, you: true },
    ...(p.competitors || []),
  ].filter((r) => r && r.name);
  const weeks = [1, 2, 3, 4].map((w) => p.plan.filter((x) => x.week === w)).filter((w) => w.length);
  const startHref = `/managed?proposal=${encodeURIComponent(p.id)}#apply`;

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
      {/* Summary */}
      <header className="mb-12">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">
          Growth proposal · prepared {fmtDate(p.createdAt)}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.04] tracking-[-0.03em] mb-3 text-balance">{p.place.name}</h1>
        <p className="text-sm text-forest-900/70 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
          {p.place.address && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {p.place.address}</span>}
          {p.place.rating != null && <span className="inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> {p.place.rating.toFixed(1)} from {p.place.reviews} reviews</span>}
        </p>
        <div className="rounded-4xl bg-forest-900 text-canvas-50 p-7 sm:p-9">
          <p className="text-lg sm:text-xl leading-relaxed text-pretty">{p.headline.join(" ")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-7 pt-6 border-t border-canvas-50/15">
            <Stat n={p.counts.total} label="issues found" />
            <Stat n={p.counts.weDo} label="we just do" />
            <Stat n={p.counts.approve} label="need your OK" />
            <Stat n={p.counts.help} label="need your help" />
          </div>
        </div>
      </header>

      {/* Competitors */}
      {rows.length > 1 && (
        <section className="mb-14">
          <h2 className="font-display text-2xl sm:text-3xl mb-2">How you compare with your nearest competitors</h2>
          {p.position?.query && (
            <p className="text-sm text-forest-900/60 mb-5">
              Google search for <strong className="text-forest-900">“{p.position.query}”</strong>:{" "}
              {p.position.rank ? `you appear #${p.position.rank}.` : `you're not in the top ${p.position.of || 20}.`}
            </p>
          )}
          <div className="overflow-x-auto rounded-4xl border hairline bg-white">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b hairline text-left text-forest-900/70">
                  <th className="p-3.5 font-medium">Business</th>
                  <th className="p-3.5 font-medium text-right">Distance</th>
                  <th className="p-3.5 font-medium text-right">Rating</th>
                  <th className="p-3.5 font-medium text-right">Reviews</th>
                  <th className="p-3.5 font-medium text-right">Photos</th>
                  <th className="p-3.5 font-medium text-center">Website</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id || r.name} className={`border-b hairline last:border-0 ${r.you ? "bg-indigo-500/[0.06] font-medium" : ""}`}>
                    <td className="p-3.5">
                      {r.mapsUri ? (
                        <a href={r.mapsUri} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                          {r.name}{r.you ? " (you)" : ""} <ExternalLink className="w-3 h-3 opacity-40" />
                        </a>
                      ) : <>{r.name}{r.you ? " (you)" : ""}</>}
                    </td>
                    <td className="p-3.5 text-right tabular-nums text-forest-900/60">{r.you ? "—" : fmtDistance(r.distanceM)}</td>
                    <td className="p-3.5 text-right tabular-nums">{r.rating != null ? r.rating.toFixed(1) : "—"}</td>
                    <td className="p-3.5 text-right tabular-nums">{r.reviews}</td>
                    <td className="p-3.5 text-right tabular-nums">{r.photos == null ? <span className="text-forest-900/65">—</span> : r.photosAtLeast ? "10+" : r.photos}</td>
                    <td className="p-3.5 text-center">{r.hasWebsite ? <Check className="w-4 h-4 text-emerald-600 inline" aria-label="Yes" /> : <span className="text-forest-900/65">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-forest-900/65 mt-2.5">Source: Google Maps data, {fmtDate(p.createdAt)}.</p>
        </section>
      )}

      {/* Issues */}
      <section className="mb-14">
        <h2 className="font-display text-2xl sm:text-3xl mb-2">What&apos;s holding you back, in the order we&apos;d fix it</h2>
        <p className="text-sm text-forest-900/60 mb-6">Each issue shows the evidence we measured and who needs to act.</p>
        {p.issues.length === 0 ? (
          <p className="text-forest-900/65">We didn&apos;t find a measurable gap. Your listing and website are in good shape.</p>
        ) : (
          <ol className="space-y-3">
            {p.issues.map((iss, i) => {
              const Icon = HANDLED_ICON[iss.handledBy];
              return (
                <li key={iss.id} className="rounded-4xl border hairline bg-white p-6">
                  <div className="flex flex-wrap items-start gap-3 mb-2">
                    <span className="font-display text-xl text-forest-900/25 w-7 shrink-0">{i + 1}</span>
                    <h3 className="font-display text-lg leading-snug flex-1 min-w-[220px]">{iss.title}</h3>
                    <span className={`text-[11px] px-2 py-1 rounded-md font-semibold inline-flex items-center gap-1 ${HANDLED_TONE[iss.handledBy]}`}>
                      <Icon className="w-3 h-3" aria-hidden="true" /> {HANDLED_BY[iss.handledBy].label}
                    </span>
                  </div>
                  <div className="sm:pl-10 space-y-2 text-sm leading-relaxed">
                    <p><span className="text-[10px] uppercase tracking-wider font-semibold text-forest-900/65 mr-1.5">Measured</span><span className="text-forest-900/75">{iss.why}</span></p>
                    <p className="text-forest-900/65">{iss.detail}</p>
                    <p className="text-xs text-forest-900/65">Why this position: {iss.reason}.</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Plan */}
      {weeks.length > 0 && (
        <section className="mb-14">
          <h2 className="font-display text-2xl sm:text-3xl mb-6">Your first four weeks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeks.map((items) => (
              <div key={items[0].week} className="rounded-4xl border hairline bg-canvas-50 p-5">
                <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-1">Week {items[0].week}</div>
                <div className="text-xs text-forest-900/65 mb-4">from {fmtDate(items[0].plannedFor)}</div>
                <ul className="space-y-3">
                  {items.map((x) => (
                    <li key={x.issueId} className="text-sm leading-snug">
                      {x.title}
                      <div className="text-[11px] text-forest-900/65 mt-0.5">{HANDLED_BY[x.handledBy].short}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {p.issues.length > p.plan.length && (
            <p className="text-sm text-forest-900/70 mt-4">The remaining {p.issues.length - p.plan.length} issues follow in month two.</p>
          )}
        </section>
      )}

      {/* Price */}
      <section className="mb-14 grid lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="rounded-4xl bg-forest-900 text-canvas-50 p-8 sm:p-10">
          <div className="text-[11px] uppercase tracking-[0.15em] text-indigo-400 mb-2">Recommended plan · {p.tier.name}</div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-display text-5xl">{p.tier.price}</span>
            <span className="text-sm text-canvas-50/75">per month + GST</span>
          </div>
          <p className="text-canvas-50/75 leading-relaxed mb-6">{p.tier.pitch}</p>
          <ul className="space-y-2 mb-8">
            {managed.features.map((f) => (
              <li key={f} className="text-sm flex items-start gap-2.5 text-canvas-50/85">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400" aria-hidden="true" /> {f}
              </li>
            ))}
          </ul>
          <Link href={startHref} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl btn-premium text-white font-semibold">
            Start with Growlocal <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <p className="text-xs text-canvas-50/75 mt-4 leading-relaxed">
            Month to month. Tier is based on the {p.counts.total} issue{p.counts.total === 1 ? "" : "s"} in this proposal.
          </p>
        </div>
        <div className="rounded-4xl border hairline bg-white p-8">
          <h3 className="font-display text-xl mb-4">What happens next</h3>
          <ol className="space-y-4 text-sm text-forest-900/70 leading-relaxed">
            <li><strong className="text-forest-900">1. Tell us to start.</strong> We confirm the plan and send an invoice — online checkout is coming soon.</li>
            <li><strong className="text-forest-900">2. Give us access.</strong> Add us as a Manager on your Google Business Profile from its settings. No password needed, and you can remove us anytime.</li>
            <li><strong className="text-forest-900">3. We start week 1.</strong> Changes that need your OK come to you on WhatsApp. Everything else just happens.</li>
          </ol>
        </div>
      </section>

      {/* Limits */}
      <section className="rounded-4xl border hairline bg-canvas-50 p-6 sm:p-8">
        <h2 className="font-display text-lg mb-3 inline-flex items-center gap-2"><Info className="w-4 h-4 text-forest-900/70" /> What this proposal can and can&apos;t tell you</h2>
        <ul className="space-y-1.5 text-xs text-forest-900/60 leading-relaxed list-disc pl-5">
          {p.limits.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </section>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="font-display text-3xl">{n}</div>
      <div className="text-xs text-canvas-50/75">{label}</div>
    </div>
  );
}
