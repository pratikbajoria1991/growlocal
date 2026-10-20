import Link from "next/link";
import {
  ArrowRight, Search, Bot, MapPin, Check, Sparkles, MessageCircle, FileText, LineChart,
  Radar, Route, Users, ScanSearch, FlaskConical, BookCheck, ShieldCheck, UserCheck, HandHelping, Scale, BadgeCheck,
} from "lucide-react";
import { BRAND, PRODUCTS, WEBSITE_AUDIT_CATEGORIES, HOME_FAQ, HOW_IT_WORKS } from "@/lib/brand";
import { MARKET, HIGH_TICKET, INDIA_BATCH, TOTAL_LISTINGS } from "@/lib/market-data";
import { JsonLd, faqSchema, webPageSchema, breadcrumbSchema, howToSchema } from "@/lib/schema";
import { HeroForm } from "@/components/home/HeroForm";
import { ReportMock } from "@/components/home/ReportMock";
import { Reveal } from "@/components/home/Reveal";
import { CountUp } from "@/components/home/CountUp";

export const metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.metaDescription,
  alternates: { canonical: BRAND.url },
};

const ICONS = { SEO: Search, AEO: Bot, GEO: MapPin };

const WEEK = [
  { icon: FileText, t: "Your profile stays active", d: "New posts, current services and fresh photos on your Google Business Profile." },
  { icon: MessageCircle, t: "Reviews get answered", d: "Positive reviews get a reply. Negative ones are drafted and sent to you on WhatsApp first." },
  { icon: Search, t: "Your website gets fixed", d: "FAQ and schema added so Google and AI assistants can understand and quote you." },
  { icon: LineChart, t: "You see what changed", d: "A monthly report from your own Google numbers: calls, directions and website clicks." },
];

// Each stat is a measured aggregate from our own audits (src/lib/market-data.js).
const STATS = [
  { n: MARKET.aeoBelow50, s: "%", t: "of websites are unreadable to AI assistants", d: `scored under 50/100 for answer-engine readiness (${MARKET.auditedSites.toLocaleString("en-IN")} sites audited)` },
  { n: MARKET.notInTop20, s: "%", t: "don’t appear in Google’s top 20", d: `for their own category + neighbourhood (${MARKET.rankedSearches.toLocaleString("en-IN")} live searches)` },
  { n: MARKET.reviewGap, s: "%", t: "have far fewer reviews than the top results", d: "at least 1.5× fewer than the top 3 for the same search" },
  { n: MARKET.noWebsite, s: "%", t: "link no website at all on Google", d: `and ${MARKET.deadSites} more link one that no longer loads` },
];

const CREW = [
  { icon: Radar, t: "Discover", d: "Measures your live Google profile, your nearest competitors and your website. Every issue comes with a number." },
  { icon: Route, t: "Plan", d: "A lead strategist ranks the issues for your goal and hands each to the right specialist." },
  { icon: Users, t: "Do", d: "GBP, SEO, AEO and GEO specialists draft fixes in parallel: profile copy, schema, FAQ answers and page titles." },
  { icon: ScanSearch, t: "Check", d: "Three independent checks per draft: rules in code, a fact-checking agent, and a second model. Anything unsupported is cut." },
  { icon: FlaskConical, t: "Prove", d: "Website fixes are applied to a copy of your page and re-scored with the same audit, so you see the before and after." },
  { icon: BookCheck, t: "Record", d: "Everything is logged. Safe changes ship; name, category, hours and review replies wait for your OK." },
];

const PRINCIPLES = [
  { icon: Scale, t: "Facts only", d: "Every sentence we write about you traces to a measured Google number or something you told us. If we don’t know, we ask. We never invent services, prices, awards or reviews." },
  { icon: UserCheck, t: "You stay in control", d: "Low-risk work (posts, schema, technical fixes) just happens. Anything that can hurt a profile waits for your approval: name, category, address, hours, and replies to negative reviews." },
  { icon: ShieldCheck, t: "Measured, not promised", d: "We don’t promise rankings. We show before-and-after audit scores and your own Google numbers, and say plainly what we can’t measure yet." },
];

const H2 = "font-display font-bold text-3xl sm:text-5xl leading-[1.04] tracking-[-0.045em] text-balance";

export default function Home() {
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/", title: `${BRAND.name} — ${BRAND.tagline}`, description: BRAND.definition })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }])} />
      <JsonLd data={faqSchema(HOME_FAQ)} />
      <JsonLd data={howToSchema({
        name: "How Growlocal handles your local marketing",
        description: "From a free audit to weekly done-for-you work and a monthly results report.",
        steps: HOW_IT_WORKS,
      })} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-14 sm:pt-24 text-center">
          <a href="#data" className="eyebrow normal-case tracking-normal text-[13px] font-medium hover:border-indigo-500/60 transition-colors mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden="true" />
            We&apos;ve studied {TOTAL_LISTINGS.toLocaleString("en-IN")} local businesses across India. See what we found <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </a>

          <h1 className="font-display font-bold text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[5rem] tracking-[-0.05em] mb-7 max-w-5xl mx-auto text-balance">
            When customers ask Google or ChatGPT, be the name it gives.
          </h1>

          <p className="text-lg sm:text-xl text-forest-900/70 mb-10 max-w-2xl mx-auto leading-relaxed text-pretty">
            Growlocal is a done-for-you local marketing service. It audits how you show up on Google Maps, search and AI assistants, then fixes it every week. Anything risky waits for your OK.
          </p>

          <HeroForm />

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-forest-900/75">
            {["No agency retainer", "No dashboard to learn", "Month to month"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-brand/25 flex items-center justify-center"><Check className="w-3 h-3 text-indigo-700" aria-hidden="true" /></span> {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Product showcase on a sage panel */}
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 mt-14 sm:mt-20">
          <div className="relative rounded-4xl sm:rounded-5xl bg-sage-50 border hairline overflow-hidden px-4 sm:px-10 pt-10 sm:pt-16 pb-8">
            <div className="absolute inset-0 burst pointer-events-none" aria-hidden="true" />
            <Reveal enabled delay={0.1} className="relative max-w-xl mx-auto">
              <ReportMock />
            </Reveal>
          </div>
        </div>
      </section>

      {/* The data — real, aggregated, dated */}
      <section id="data" className="mt-20 sm:mt-28 bg-forest-900 text-canvas-50 relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <Reveal className="text-center max-w-4xl mx-auto">
            <p className="eyebrow eyebrow-dark mb-6"><Sparkles className="w-3.5 h-3.5 text-brand" aria-hidden="true" />The state of local visibility</p>
            <h2 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl leading-[1.04] tracking-[-0.045em] text-balance">
              We audited {MARKET.businesses.toLocaleString("en-IN")} local businesses. <span className="text-brand">Most websites are unreadable to the AI assistants customers now ask.</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.06} className="rounded-3xl bg-forest-800 border border-canvas-50/10 p-7">
                <div className="font-display font-bold text-6xl sm:text-7xl tracking-[-0.05em] text-brand leading-none mb-5"><CountUp to={s.n} suffix={s.s} /></div>
                <div className="font-semibold mb-1.5 leading-snug">{s.t}</div>
                <div className="text-sm text-canvas-50/70 leading-relaxed">{s.d}</div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-xs text-canvas-50/60 max-w-3xl mx-auto text-center leading-relaxed">
            Method: live Google Maps data and our own SEO/AEO/GEO website audit, run {MARKET.asOf} on {MARKET.businesses.toLocaleString("en-IN")} unique local businesses in one large metro — clinics, skin, dental and eye care, fertility, jewellers, furniture, bathroom and tiles, home automation, interiors, real estate,
            salons and professional services. This is the set we chose to
            audit, not a random sample of every business in the city. Search position is one Google search per business; it varies by where the customer stands.
          </p>
        </div>
      </section>

      {/* High-ticket study — verified against live Google, aggregates only */}
      <section id="high-ticket" className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28">
        <Reveal className="max-w-3xl mx-auto text-center mb-12">
          <p className="eyebrow mb-6"><BadgeCheck className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />Verified study · {HIGH_TICKET.asOf}</p>
          <h2 className={`${H2} mb-5`}>
            {HIGH_TICKET.listings.toLocaleString("en-IN")} high-ticket local businesses. <span className="text-indigo-600">Every number checked against live Google.</span>
          </h2>
          <p className="text-lg text-forest-900/70 leading-relaxed text-pretty">
            Skin and aesthetic clinics, jewellers, furniture, bathroom and tiles, home automation, specialist clinics, architects, wedding venues and more:
            {" "}{HIGH_TICKET.categories} categories where one customer is worth thousands of rupees.
          </p>
        </Reveal>

        {/* Validation strip */}
        <div className="rounded-4xl bg-forest-900 text-canvas-50 p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            [`${HIGH_TICKET.liveChecked}/${HIGH_TICKET.listings}`, "re-checked on live Google before use", `${HIGH_TICKET.liveNotFound} not found, 0 errors`],
            [HIGH_TICKET.liveCorrected, "listings corrected to live values", "review counts and ratings had changed since collection"],
            [HIGH_TICKET.heldOut, "set aside before any outreach", "branches already covered by a flagship, unconfirmed categories, temporarily closed"],
            [HIGH_TICKET.sitesChecked, "websites fetched and scored", `${HIGH_TICKET.sitesBroken} no longer load: dead domains, unreachable or 404`],
          ].map(([n, t, d]) => (
            <div key={t} className="min-w-0">
              <div className="font-display font-bold text-3xl sm:text-4xl tracking-[-0.04em] text-brand tabular-nums mb-2">{n}</div>
              <div className="font-semibold text-sm leading-snug mb-1">{t}</div>
              <div className="text-xs text-canvas-50/65 leading-relaxed">{d}</div>
            </div>
          ))}
        </div>

        {/* Findings */}
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            [HIGH_TICKET.aeoBelow50, "%", "of their websites are hard for AI assistants to read", `${HIGH_TICKET.sitesScored} sites scored; median ${HIGH_TICKET.medianAeo}/100, and ${HIGH_TICKET.aeoZero} scored zero`],
            [HIGH_TICKET.reviewGap, "%", "have far fewer reviews than the top 3", `at least 1.5× fewer for the same search (of 804 comparable); the median gap is ${HIGH_TICKET.medianReviewGap}×`],
            [HIGH_TICKET.notInTop20, "%", "don’t appear in Google’s top 20", "for their own category and neighbourhood, one live search each"],
            [HIGH_TICKET.noWebsite, "%", "link no website on Google", "the profile is the only page a customer can find"],
          ].map(([n, s, t, d], i) => (
            <Reveal key={t} delay={i * 0.06} className="rounded-3xl bg-white border hairline p-6">
              <div className="font-display font-bold text-5xl tracking-[-0.05em] leading-none mb-4"><CountUp to={n} suffix={s} /></div>
              <div className="font-semibold leading-snug mb-1.5">{t}</div>
              <div className="text-sm text-forest-900/65 leading-relaxed">{d}</div>
            </Reveal>
          ))}
        </div>

        {/* Work plan + limits */}
        <div className="mt-4 grid lg:grid-cols-[1.3fr_1fr] gap-4">
          <div className="rounded-3xl bg-sage-50 border hairline p-6 sm:p-8">
            <h3 className="font-display font-bold text-2xl tracking-[-0.03em] mb-1">{HIGH_TICKET.fixes.toLocaleString("en-IN")} prioritised fixes</h3>
            <p className="text-sm text-forest-900/70 mb-6">Each one tied to a measured finding, with who acts and how we will measure it.</p>
            <div className="flex h-3 rounded-full overflow-hidden mb-5" role="img" aria-label={`${HIGH_TICKET.weDo} we do, ${HIGH_TICKET.afterOk} after the owner's OK, ${HIGH_TICKET.needOwner} need the owner`}>
              <span className="bg-forest-900" style={{ width: `${(HIGH_TICKET.weDo / HIGH_TICKET.fixes) * 100}%` }} />
              <span className="bg-brand" style={{ width: `${(HIGH_TICKET.afterOk / HIGH_TICKET.fixes) * 100}%` }} />
              <span className="bg-forest-900/20" style={{ width: `${(HIGH_TICKET.needOwner / HIGH_TICKET.fixes) * 100}%` }} />
            </div>
            <ul className="grid sm:grid-cols-3 gap-4 text-sm">
              {[
                ["bg-forest-900", HIGH_TICKET.weDo, "We do it"],
                ["bg-brand", HIGH_TICKET.afterOk, "We do it after your OK"],
                ["bg-forest-900/20", HIGH_TICKET.needOwner, "We need something from you"],
              ].map(([c, n, t]) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${c}`} aria-hidden="true" />
                  <span><span className="font-display font-bold text-xl tabular-nums block">{n.toLocaleString("en-IN")} <span className="text-sm font-medium text-forest-900/60">({Math.round((n / HIGH_TICKET.fixes) * 100)}%)</span></span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white border hairline p-6 sm:p-8">
            <h3 className="font-display font-bold text-2xl tracking-[-0.03em] mb-4">What we couldn&apos;t measure yet</h3>
            <ul className="space-y-3 text-sm">
              {HIGH_TICKET.notMeasured.map(([m, why]) => (
                <li key={m}><span className="font-semibold">{m}:</span> <span className="text-forest-900/70">{why}.</span></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-6 text-xs text-forest-900/60 max-w-3xl mx-auto text-center leading-relaxed">
          Method: Google Maps listings collected for high-ticket categories across one large metro, each re-fetched from the live Google Places API on {HIGH_TICKET.asOf},
          ranked with one live search for its own category and area, and its website scored with our SEO/AEO/GEO audit. Percentages are of all {HIGH_TICKET.listings} listings
          unless stated. These {HIGH_TICKET.listings} are included in the {MARKET.businesses.toLocaleString("en-IN")} above. This is the set we chose to study, not a random sample. No business is named.
        </p>
      </section>

      {/* Google profile study across Indian cities — validated against live Google */}
      <section id="india" className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28">
        <Reveal className="max-w-3xl mx-auto text-center mb-12">
          <p className="eyebrow mb-6"><BadgeCheck className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />Profile study · {INDIA_BATCH.asOf}</p>
          <h2 className={`${H2} mb-5`}>
            {INDIA_BATCH.listings.toLocaleString("en-IN")} hospitals and fertility clinics in {INDIA_BATCH.cities} Indian cities. <span className="text-indigo-600">Cleaned and checked against live Google.</span>
          </h2>
          <p className="text-lg text-forest-900/70 leading-relaxed text-pretty">
            Covers {new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(INDIA_BATCH.types.map(([t, n]) => `${t} (${n})`))}. We chose these practice types because each new patient is a large booking.
          </p>
        </Reveal>

        <div className="rounded-4xl bg-forest-900 text-canvas-50 p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            [INDIA_BATCH.listings.toLocaleString("en-IN"), "listings after cleaning", `${INDIA_BATCH.collected.toLocaleString("en-IN")} collected; ${INDIA_BATCH.closedRemoved} that Google shows as closed were removed`],
            [INDIA_BATCH.overlapWithEarlier, `overlap with our earlier ${MARKET.businesses.toLocaleString("en-IN")}`, "matched by Google's own listing ID, not by name"],
            [INDIA_BATCH.liveChecked.toLocaleString("en-IN"), "re-checked on live Google", "every listing, in one pass: names, phones, websites and PIN codes matched; ratings within 0.1; review counts within 10"],
            [INDIA_BATCH.organisations, "distinct organisations", `${INDIA_BATCH.branchListings} of the ${INDIA_BATCH.listings} listings are branches in ${INDIA_BATCH.branchGroups} multi-site groups`],
          ].map(([n, t, d]) => (
            <div key={t} className="min-w-0">
              <div className="font-display font-bold text-3xl sm:text-4xl tracking-[-0.04em] text-brand tabular-nums mb-2">{n}</div>
              <div className="font-semibold text-sm leading-snug mb-1">{t}</div>
              <div className="text-xs text-canvas-50/65 leading-relaxed">{d}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            [Math.round((INDIA_BATCH.noWebsite / INDIA_BATCH.listings) * 100), "link no website on Google", `${INDIA_BATCH.noWebsite} of ${INDIA_BATCH.listings}: the profile is the only page a patient can find`],
            [Math.round((INDIA_BATCH.reviewsUnder76 / INDIA_BATCH.listings) * 100), "have fewer than 76 reviews", `${INDIA_BATCH.reviewsUnder76} of ${INDIA_BATCH.listings}; the median across all is ${INDIA_BATCH.medianReviews}`],
            [Math.round((INDIA_BATCH.ratedUnder43 / INDIA_BATCH.listings) * 100), "are rated below 4.3 stars", `${INDIA_BATCH.ratedUnder43} of ${INDIA_BATCH.listings}; ${INDIA_BATCH.rated45Plus} are rated 4.5 or higher`],
            [Math.round((INDIA_BATCH.noWebsiteAndUnder76 / INDIA_BATCH.listings) * 100), "have both gaps", `${INDIA_BATCH.noWebsiteAndUnder76} listings with no website and under 76 reviews: the clearest openings`],
          ].map(([n, t, d], i) => (
            <Reveal key={t} delay={i * 0.06} className="rounded-3xl bg-white border hairline p-6">
              <div className="font-display font-bold text-5xl tracking-[-0.05em] leading-none mb-4"><CountUp to={n} suffix="%" /></div>
              <div className="font-semibold leading-snug mb-1.5">{t}</div>
              <div className="text-sm text-forest-900/65 leading-relaxed">{d}</div>
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-sage-50 border hairline p-6 sm:p-8">
            <h3 className="font-display font-bold text-2xl tracking-[-0.03em] mb-3">What the live check caught</h3>
            <ul className="space-y-3 text-sm text-forest-900/80 leading-relaxed">
              <li><span className="font-semibold">Scraped photo counts were wrong.</span> The scrape counted under 5 photos for {INDIA_BATCH.photoFlagFalse.flagged} listings, but live Google shows 5 or more for {INDIA_BATCH.photoFlagFalse.wrong} of them. Only {INDIA_BATCH.photosUnder5} of the {INDIA_BATCH.listings} really have fewer than 5, so we use the live count.</li>
              <li><span className="font-semibold">Closed practices slip through.</span> {INDIA_BATCH.closedRemoved} listings were closed on Google (2 permanently), and the scrape had flagged only 2. All are removed from every number here.</li>
              <li><span className="font-semibold">One listing is not one business.</span> Chains list every branch, so {INDIA_BATCH.listings} listings are about {INDIA_BATCH.organisations} organisations.</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white border hairline p-6 sm:p-8">
            <h3 className="font-display font-bold text-2xl tracking-[-0.03em] mb-3">What this doesn&apos;t show</h3>
            <ul className="space-y-3 text-sm text-forest-900/80 leading-relaxed">
              <li>Profile data only. Website quality, Google rankings and AI answers were measured for the {MARKET.businesses.toLocaleString("en-IN")} businesses above, not for these.</li>
              <li>City-to-city comparisons: most cities were searched for one practice type only, so they aren&apos;t comparable.</li>
              <li>How recent the reviews are, and calls or direction requests.</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-xs text-forest-900/60 max-w-3xl mx-auto text-center leading-relaxed">
          Method: public Google Maps listings collected {INDIA_BATCH.asOf} for {INDIA_BATCH.cities} cities, deduplicated by Google listing ID, and all {INDIA_BATCH.liveChecked.toLocaleString("en-IN")} re-fetched from the live Google Places API in one pass,
          so every figure is a live value, not an estimate. Percentages are of the {INDIA_BATCH.listings} listings Google shows as open. This is the set we chose to study, not a random sample, and the search
          was stopped before it covered every planned city and practice type. No business is named. Together with the {MARKET.businesses.toLocaleString("en-IN")} audited above, that is {TOTAL_LISTINGS.toLocaleString("en-IN")} listings.
        </p>
      </section>

      {/* Three surfaces */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal className="max-w-3xl mx-auto text-center mb-14">
          <h2 className={`${H2} mb-5`}>
            Three places. Each reads your business differently.
          </h2>
          <p className="text-lg text-forest-900/70 leading-relaxed text-pretty">
            Google search, Google Maps, and AI assistants that simply name two or three options. Keeping all three current is a weekly job most owners
            don&apos;t have time for. That job is what we take off your hands.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {Object.entries(WEBSITE_AUDIT_CATEGORIES).map(([k, m], i) => {
            const Icon = ICONS[k];
            return (
              <Reveal key={k} delay={i * 0.07}>
                <article className="h-full rounded-4xl border hairline bg-white overflow-hidden hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300">
                  <div className="relative h-36 flex items-center justify-center overflow-hidden" style={{ background: `${m.color}24` }} aria-hidden="true">
                    <div className="absolute inset-0 burst" />
                    <div className="relative w-16 h-16 rounded-2xl bg-white shadow-lift flex items-center justify-center">
                      <Icon className="w-7 h-7" style={{ color: m.color }} />
                    </div>
                  </div>
                  <div className="p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest-900/65 mb-2">{m.tag}</p>
                    <h3 className="font-display font-bold text-2xl tracking-[-0.03em] mb-3">{m.name}</h3>
                    <p className="text-forest-900/70 leading-relaxed">{m.description}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* The crew */}
      <section className="bg-sage-50 border-y hairline">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 self-start">
            <h2 className={`${H2} mb-5`}>
              A team of specialist AI agents. <span className="text-indigo-600">Checked by code, then by you.</span>
            </h2>
            <p className="text-lg text-forest-900/70 leading-relaxed text-pretty mb-8">
              One goal, six stages. The agents draft; independent checks decide what survives; your own audit proves it worked before anything ships.
            </p>
            <div className="flex flex-col items-start gap-2 text-sm text-forest-900/80">
              {[[ShieldCheck, "We do it: low-risk work that ships on its own"], [UserCheck, "You approve: name, category, hours, sensitive replies"], [HandHelping, "We need you: photos and review requests"]].map(([I, t]) => (
                <span key={t} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border hairline bg-white"><I className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />{t}</span>
              ))}
            </div>
          </Reveal>
          <ol className="grid sm:grid-cols-2 gap-4">
            {CREW.map((c, i) => (
              <li key={c.t} className="rounded-3xl bg-white border hairline p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="w-11 h-11 rounded-2xl bg-brand/20 flex items-center justify-center"><c.icon className="w-5 h-5 text-indigo-700" aria-hidden="true" /></span>
                  <span className="font-mono text-xs text-forest-900/60 tabular-nums" aria-hidden="true">{String(i + 1).padStart(2, "0")} / {String(CREW.length).padStart(2, "0")}</span>
                </div>
                <h3 className="font-display font-bold text-xl tracking-[-0.03em] mb-1.5">{c.t}</h3>
                <p className="text-forest-900/70 leading-relaxed text-[15px]">{c.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Principles + definition */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal className="max-w-4xl mx-auto text-center mb-14">
          <p className="font-display font-semibold text-2xl sm:text-4xl leading-[1.2] tracking-[-0.035em] text-balance">{BRAND.definition}</p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {PRINCIPLES.map((p) => (
            <div key={p.t} className="rounded-4xl bg-white border hairline p-8">
              <span className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center mb-6"><p.icon className="w-5 h-5 text-brand" aria-hidden="true" /></span>
              <h3 className="font-display font-bold text-2xl tracking-[-0.03em] mb-3">{p.t}</h3>
              <p className="text-forest-900/70 leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A week with Growlocal */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
        <Reveal className="max-w-3xl mx-auto text-center mb-14">
          <h2 className={H2}>
            What does Growlocal do for my business?
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WEEK.map((w, i) => {
            const dark = i === 0;
            return (
              <Reveal key={w.t} delay={i * 0.06}>
                <div className={`h-full rounded-4xl p-7 ${dark ? "bg-forest-900 text-canvas-50" : "bg-white border hairline"}`}>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-6 ${dark ? "bg-brand" : "bg-brand/20"}`}>
                    <w.icon className={`w-5 h-5 ${dark ? "text-brand-ink" : "text-indigo-700"}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-bold text-xl tracking-[-0.03em] mb-2">{w.t}</h3>
                  <p className={`text-[15px] leading-relaxed ${dark ? "text-canvas-50/75" : "text-forest-900/70"}`}>{w.d}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* How it works — mirrors HowTo schema */}
      <section className="bg-sage-50 border-y hairline">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <h2 className={`${H2} mb-14 text-center`}>
            How do I get started?
          </h2>
          <ol className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
            <span className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-forest-900/15" aria-hidden="true" />
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.name} className="relative text-center">
                <div className="relative w-12 h-12 mx-auto rounded-full bg-brand text-brand-ink font-display font-bold text-lg flex items-center justify-center mb-5 ring-8 ring-sage-50 tabular-nums">{i + 1}</div>
                <h3 className="font-display font-bold text-xl tracking-[-0.03em] mb-2">{s.name}</h3>
                <p className="text-[15px] text-forest-900/70 leading-relaxed max-w-xs mx-auto">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <h2 className={`${H2} mb-14 max-w-3xl mx-auto text-center`}>
          Start free. Hand it over when you&apos;re ready.
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {PRODUCTS.map((p, i) => {
            const dark = i === 1;
            return (
              <article key={p.id} className={`flex flex-col rounded-4xl sm:rounded-5xl p-8 sm:p-10 ${dark ? "bg-forest-900 text-canvas-50" : "bg-white border hairline"}`}>
                <div className={`text-sm font-semibold mb-3 ${dark ? "text-brand" : "text-indigo-700"}`}>
                  {p.name}{p.statusNote ? ` · ${p.statusNote}` : ""}
                </div>
                <h3 className="font-display font-bold text-3xl tracking-[-0.04em] mb-4">{p.headline}</h3>
                <p className={`leading-relaxed mb-6 ${dark ? "text-canvas-50/75" : "text-forest-900/70"}`}>{p.blurb}</p>
                <ul className="space-y-2.5 mb-8">
                  {p.bullets.map((b) => (
                    <li key={b} className={`text-[15px] flex items-start gap-2.5 ${dark ? "text-canvas-50/85" : "text-forest-900/80"}`}>
                      <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-brand" : "bg-brand/25"}`}>
                        <Check className={`w-3 h-3 ${dark ? "text-brand-ink" : "text-indigo-700"}`} aria-hidden="true" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`mt-auto self-start inline-flex items-center gap-2 px-6 py-3 text-[15px] ${dark ? "btn-premium" : "rounded-full font-semibold bg-forest-900 text-canvas-50 hover:bg-forest-800 transition-colors"}`}
                >
                  {p.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* FAQ — rendered text matches the FAQPage schema above */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28 grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
        <h2 className={`${H2} lg:sticky lg:top-28 self-start`}>
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {HOME_FAQ.map((f) => (
            <details key={f.q} className="group rounded-3xl bg-white border hairline px-6 py-5 open:shadow-lift transition-shadow">
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                <h3 className="font-display font-semibold text-lg leading-snug tracking-[-0.02em]">{f.q}</h3>
                <span className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-brand/20 text-indigo-800 flex items-center justify-center group-open:rotate-45 group-open:bg-brand transition-all" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-forest-900/70 leading-relaxed text-pretty">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="relative rounded-4xl sm:rounded-5xl bg-brand text-forest-900 px-6 py-14 sm:p-20 overflow-hidden text-center">
          <div className="absolute inset-0 burst pointer-events-none" aria-hidden="true" />
          <div className="relative">
            <h2 className="font-display font-bold text-4xl sm:text-6xl leading-[1.02] tracking-[-0.05em] mb-5 max-w-3xl mx-auto text-balance">See what&apos;s costing you customers.</h2>
            <p className="text-lg text-forest-900/80 mb-10 max-w-xl mx-auto leading-relaxed text-pretty">
              Start with the free audit. No signup, no sales call. If you&apos;d rather not fix it yourself, we&apos;ll handle it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/audit" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-forest-900 text-canvas-50 font-semibold hover:bg-forest-800 transition-colors">
                Get my free audit <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/managed#apply" className="inline-flex items-center justify-center gap-2 px-7 py-4 btn-ghost text-forest-900">
                Apply for a founding slot
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
