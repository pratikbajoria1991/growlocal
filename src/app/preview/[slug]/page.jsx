import { notFound } from "next/navigation";
import { Phone, MapPin, Clock, Star, MessageCircle, Navigation, Check, ArrowUpRight, ShieldCheck } from "lucide-react";
import { getPreview, themeFor } from "@/lib/site-preview";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getPreview(slug);
  if (!p) return { title: "Preview not found", robots: { index: false, follow: false } };
  return {
    title: { absolute: `${p.name}${p.area ? ` — ${p.area}` : ""}${p.city ? `, ${p.city}` : ""} (preview)` },
    description: `${p.name}${p.category ? `, ${p.category.toLowerCase()}` : ""} in ${p.area || p.city}. Address, opening hours and contact.`,
    // A preview of someone else's business must never compete with their
    // real listing in search.
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const pad = (n) => String(n).padStart(2, "0");

// schema.org hours straight from Google's periods — no inference.
function hoursSpec(periods) {
  return periods
    .filter((x) => x.open && x.close)
    .map((x) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_NAMES[x.open.day],
      opens: `${pad(x.open.hour ?? 0)}:${pad(x.open.minute ?? 0)}`,
      closes: `${pad(x.close.hour ?? 0)}:${pad(x.close.minute ?? 0)}`,
    }));
}

function faq(p) {
  const items = [];
  if (p.address) items.push({ q: `Where is ${p.name}?`, a: `${p.name} is at ${p.address}.` });
  if (p.hours.length) items.push({ q: `What are ${p.name}'s opening hours?`, a: p.hours.join("; ") + "." });
  if (p.phone) items.push({ q: `How do I contact ${p.name}?`, a: `Call ${p.phone}${p.whatsapp ? " or send a WhatsApp message to the same number" : ""}.` });
  if (p.rating != null && p.reviews > 0) items.push({ q: `What do customers say about ${p.name}?`, a: `${p.name} is rated ${p.rating.toFixed(1)} out of 5 from ${p.reviews} reviews on Google.` });
  if (p.facts.length) items.push({ q: `What facilities does ${p.name} offer?`, a: `${p.facts.join(", ")}.` });
  return items;
}

export default async function PreviewSite({ params }) {
  const { slug } = await params;
  const p = await getPreview(slug);
  if (!p) notFound();

  const theme = themeFor([p.primaryType]);
  const questions = faq(p);
  const where = [p.area, p.city].filter(Boolean).join(", ");
  const claimHref = `${BRAND.url}/managed?preview=${encodeURIComponent(p.slug)}#apply`;
  const removeHref = `mailto:${BRAND.email}?subject=${encodeURIComponent(`Remove preview: ${p.slug}`)}&body=${encodeURIComponent(`Please remove the preview website for ${p.listingName}.`)}`;
  const callHref = p.phoneHref ? `tel:${p.phoneHref}` : null;
  const waHref = p.whatsapp ? `https://wa.me/${p.whatsapp}` : null;
  const primaryHref = callHref || waHref || p.mapsUri;

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: p.name,
    ...(p.address ? { address: { "@type": "PostalAddress", streetAddress: p.address, addressLocality: p.city, ...(p.postalCode ? { postalCode: p.postalCode } : {}), addressCountry: "IN" } } : {}),
    ...(p.lat != null ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } } : {}),
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(p.periods.length ? { openingHoursSpecification: hoursSpec(p.periods) } : {}),
    ...(p.rating != null && p.reviews > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews } } : {}),
    ...(p.mapsUri ? { hasMap: p.mapsUri } : {}),
  };
  const faqSchema = questions.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: questions.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;

  return (
    <div style={{ "--accent": theme.accent, "--soft": theme.soft }} className="bg-white text-[#14161a] min-h-screen">
      {/* JSON.stringify doesn't escape "</" — a listing name/address containing
          "</script>" would otherwise close this tag early and inject markup
          from data Google's moderation doesn't fully control. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />}

      {/* Preview notice — always first, never dismissable */}
      <div className="bg-[#14161a] text-white text-[13px]">
        <div className="max-w-6xl mx-auto px-5 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 font-medium"><ShieldCheck className="w-3.5 h-3.5 opacity-80" aria-hidden="true" /> Preview website</span>
          <span className="text-white/70">Built by Growlocal from {p.listingName}&apos;s public Google listing — not the official website.</span>
          <span className="flex gap-3 ml-auto">
            <a href={claimHref} className="underline underline-offset-2 hover:text-white text-white/90">This is my business</a>
            <a href={removeHref} className="underline underline-offset-2 hover:text-white text-white/60">Remove</a>
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="font-display text-lg sm:text-xl tracking-tight truncate">{p.name}</a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-black/60">
            <a href="#visit" className="hover:text-black">Visit</a>
            {p.hours.length > 0 && <a href="#hours" className="hover:text-black">Hours</a>}
            {questions.length > 0 && <a href="#faq" className="hover:text-black">FAQ</a>}
          </nav>
          {primaryHref && (
            <a href={primaryHref} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-medium" style={{ background: "var(--accent)" }}>
              {callHref ? <Phone className="w-4 h-4" aria-hidden="true" /> : <MessageCircle className="w-4 h-4" aria-hidden="true" />}
              <span className="hidden sm:inline">{callHref ? `Call ${p.phone}` : "Message us"}</span>
              <span className="sm:hidden">{callHref ? "Call" : "Message"}</span>
            </a>
          )}
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ background: "radial-gradient(ellipse 70% 60% at 85% 10%, var(--soft), transparent 70%), radial-gradient(ellipse 50% 50% at 0% 100%, var(--soft), transparent 70%)" }} />
          <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-[1.3fr_1fr] gap-12 items-end">
            <div>
              {p.category && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ background: "var(--soft)", color: "var(--accent)" }}>
                  {p.category}{where ? ` · ${where}` : ""}
                </div>
              )}
              <h1 className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl tracking-[-0.035em] mb-6 text-balance">{p.name}</h1>
              {p.summary ? (
                <p className="text-lg sm:text-xl text-black/60 max-w-xl leading-relaxed text-pretty">{p.summary}</p>
              ) : (
                <p className="text-lg sm:text-xl text-black/60 max-w-xl leading-relaxed text-pretty">
                  {p.category ? `${p.category} in ${where || p.city}.` : `Serving ${where || p.city}.`}
                  {p.hours.length ? " See our opening hours and directions below." : " Find directions and contact details below."}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mt-9">
                {callHref && (
                  <a href={callHref} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-white font-medium" style={{ background: "var(--accent)" }}>
                    <Phone className="w-4 h-4" aria-hidden="true" /> {theme.cta}
                  </a>
                )}
                {waHref && (
                  <a href={waHref} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-black/10 hover:bg-black/[0.03] font-medium">
                    <MessageCircle className="w-4 h-4" aria-hidden="true" /> WhatsApp
                  </a>
                )}
                {p.mapsUri && (
                  <a href={p.mapsUri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-black/10 hover:bg-black/[0.03] font-medium">
                    <Navigation className="w-4 h-4" aria-hidden="true" /> Directions
                  </a>
                )}
              </div>
            </div>

            {p.rating != null && p.reviews > 0 && (
              <a href={p.mapsUri || "#"} target="_blank" rel="noopener noreferrer" className="block rounded-[28px] bg-white border border-black/[0.06] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] p-7 hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center gap-1 mb-3" aria-label={`${p.rating} out of 5 stars`}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-5 h-5" style={{ color: "#f5a524", fill: i < Math.round(p.rating) ? "#f5a524" : "transparent" }} aria-hidden="true" />
                  ))}
                </div>
                <div className="font-display text-5xl tracking-tight mb-1">{p.rating.toFixed(1)}</div>
                <div className="text-sm text-black/55 mb-4">from {p.reviews.toLocaleString("en-IN")} Google reviews</div>
                <div className="text-sm font-medium inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>Read reviews on Google <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" /></div>
              </a>
            )}
          </div>
        </section>

        {/* Visit */}
        <section id="visit" className="border-t border-black/[0.06]">
          <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20 grid md:grid-cols-3 gap-5">
            {p.address && (
              <div className="rounded-3xl p-7" style={{ background: "var(--soft)" }}>
                <MapPin className="w-5 h-5 mb-4" style={{ color: "var(--accent)" }} aria-hidden="true" />
                <h2 className="font-display text-xl mb-2">Address</h2>
                <p className="text-black/65 leading-relaxed text-[15px]">{p.address}</p>
                {p.mapsUri && <a href={p.mapsUri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-sm font-medium" style={{ color: "var(--accent)" }}>Open in Google Maps <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" /></a>}
              </div>
            )}
            {p.phone && (
              <div className="rounded-3xl p-7 border border-black/[0.06]">
                <Phone className="w-5 h-5 mb-4" style={{ color: "var(--accent)" }} aria-hidden="true" />
                <h2 className="font-display text-xl mb-2">Call</h2>
                <a href={callHref} className="text-2xl font-display tracking-tight hover:underline">{p.phone}</a>
                {waHref && <a href={waHref} className="flex items-center gap-1.5 mt-4 text-sm font-medium" style={{ color: "var(--accent)" }}><MessageCircle className="w-4 h-4" aria-hidden="true" /> Message on WhatsApp</a>}
              </div>
            )}
            <div id="hours" className="rounded-3xl p-7 border border-black/[0.06] scroll-mt-20">
              <Clock className="w-5 h-5 mb-4" style={{ color: "var(--accent)" }} aria-hidden="true" />
              <h2 className="font-display text-xl mb-3">Opening hours</h2>
              {p.hours.length ? (
                <ul className="space-y-1.5 text-[14px]">
                  {p.hours.map((h) => {
                    const [day, ...rest] = h.split(": ");
                    return (
                      <li key={h} className="flex justify-between gap-3">
                        <span className="text-black/50">{day}</span>
                        <span className="text-right">{rest.join(": ")}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-black/55 text-[15px]">Hours aren&apos;t listed on Google yet{p.phone ? " — please call ahead." : "."}</p>
              )}
            </div>
          </div>
        </section>

        {p.facts.length > 0 && (
          <section className="border-t border-black/[0.06]">
            <div className="max-w-6xl mx-auto px-5 py-14">
              <h2 className="font-display text-2xl sm:text-3xl mb-6">Good to know</h2>
              <ul className="flex flex-wrap gap-2.5">
                {p.facts.map((f) => (
                  <li key={f} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ background: "var(--soft)" }}>
                    <Check className="w-4 h-4" style={{ color: "var(--accent)" }} aria-hidden="true" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* FAQ — answers are the listing's own facts, structured for AI answer engines */}
        {questions.length > 0 && (
          <section id="faq" className="border-t border-black/[0.06] scroll-mt-20">
            <div className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
              <h2 className="font-display text-3xl sm:text-4xl tracking-tight mb-8">Frequently asked questions</h2>
              <div className="divide-y divide-black/[0.07]">
                {questions.map((f) => (
                  <details key={f.q} className="group py-5" open>
                    <summary className="cursor-pointer list-none flex justify-between gap-4">
                      <h3 className="font-display text-lg leading-snug">{f.q}</h3>
                      <span className="text-black/35 group-open:rotate-45 transition-transform text-xl leading-none" aria-hidden="true">+</span>
                    </summary>
                    <p className="mt-2.5 text-black/65 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* What the owner would add — visibly a placeholder, never filled with invented content */}
        <section className="border-t border-black/[0.06]">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <div className="rounded-[28px] border-2 border-dashed border-black/10 p-8 sm:p-10 grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
              <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-black/40 mb-2">For the owner</div>
                <h2 className="font-display text-2xl sm:text-3xl mb-3 text-balance">Your services, photos and team go here.</h2>
                <p className="text-black/60 leading-relaxed">
                  This preview only shows what&apos;s already public on Google. With your go-ahead, Growlocal adds your real services,
                  photos and answers to the questions customers ask — and keeps it up to date so Google and AI assistants describe you accurately.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <a href={claimHref} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#14161a] text-white font-medium">
                  Claim this website <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a href={removeHref} className="text-center text-sm text-black/45 hover:text-black/70">Not interested? Ask us to remove it</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row justify-between gap-2 text-xs text-black/45">
          <span>{p.listingName}{p.address ? ` · ${p.address}` : ""}</span>
          <span>Preview by <a href={BRAND.url} className="underline">Growlocal</a> · details from Google, {new Date(p.refreshedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
      </footer>
    </div>
  );
}
