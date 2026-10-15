import { MapPin, Users, Search, ListOrdered } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/schema";
import { ProposalForm } from "@/components/ProposalForm";

const TITLE = "Free growth proposal for your local business";
const DESCRIPTION =
  "See how you compare with your nearest competitors on Google Maps, what's holding you back, and a 4-week plan to fix it. Free, in about 30 seconds.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BRAND.url}/proposal` },
};

const CHECKS = [
  { icon: MapPin, t: "Your live Google listing", d: "Category, hours, phone, website, photos, rating and reviews — read from Google." },
  { icon: Users, t: "Your nearest competitors", d: "The businesses like yours closest to you, and where they're ahead." },
  { icon: Search, t: "Your website", d: "Whether Google and AI assistants like ChatGPT can read and quote it." },
  { icon: ListOrdered, t: "What to fix first", d: "Every issue with its evidence, who acts on it, and a 4-week plan." },
];

export default function ProposalLanding() {
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/proposal", title: TITLE, description: DESCRIPTION })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Growth proposal", path: "/proposal" }])} />

      <section className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-14">
          <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">Free · About 30 seconds · No signup</div>
          <h1 className="font-display text-4xl sm:text-6xl leading-[1.02] tracking-[-0.03em] mb-5 text-balance">
            What&apos;s stopping local customers from <span className="text-indigo-600">choosing you?</span>
          </h1>
          <p className="text-lg text-forest-900/65 mb-8 max-w-2xl leading-relaxed text-pretty">
            We compare your Google listing and website with your nearest competitors, show you exactly where you&apos;re
            behind, and lay out what we&apos;d fix in your first four weeks — with the price.
          </p>
          <ProposalForm />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14 border-t hairline">
        <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-8 max-w-xl">What does the proposal check?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {CHECKS.map((c) => (
            <div key={c.t} className="rounded-4xl border hairline bg-white p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/12 flex items-center justify-center shrink-0">
                <c.icon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-lg mb-1">{c.t}</h3>
                <p className="text-sm text-forest-900/60 leading-relaxed">{c.d}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-forest-900/70 mt-8 max-w-2xl leading-relaxed">
          Every number comes from Google&apos;s own data or a live check of your website. Anything we can&apos;t measure is
          listed as a limit on the proposal, never guessed.
        </p>
      </section>
    </>
  );
}
