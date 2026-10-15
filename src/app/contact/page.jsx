import { Mail, MessageSquare } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { JsonLd, webPageSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { FaqSection } from "@/components/FaqSection";
import { CONTACT_FAQ } from "@/lib/page-faq";

const TITLE = "Contact Growlocal by email";
const DESCRIPTION = `Email ${BRAND.name} about the free audit, done-for-you local marketing, or per-location pricing for several branches. General and support addresses below.`;

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BRAND.url}/contact` },
};

export default function Contact() {
  return (
    <>
    <JsonLd data={webPageSchema({ path: "/contact", title: TITLE, description: DESCRIPTION })} />
    <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
    <JsonLd data={faqSchema(CONTACT_FAQ)} />
    <section className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
      <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">Contact</div>
      <h1 className="font-display text-4xl sm:text-5xl leading-tight mb-4">Talk to us.</h1>
      <p className="text-lg text-forest-900/60 leading-relaxed mb-9">
        The fastest way to reach Growlocal is email. Write about the audit, or about handing your local marketing to us.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <a href={`mailto:${BRAND.email}`} className="rounded-2xl border hairline bg-white p-6 hover:border-indigo-500/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/12 flex items-center justify-center mb-3">
            <Mail className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-medium text-sm mb-1">General</div>
          <div className="text-sm text-indigo-600">{BRAND.email}</div>
        </a>
        <a href={`mailto:${BRAND.supportEmail}`} className="rounded-2xl border hairline bg-white p-6 hover:border-indigo-500/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/12 flex items-center justify-center mb-3">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-medium text-sm mb-1">Support</div>
          <div className="text-sm text-indigo-600">{BRAND.supportEmail}</div>
        </a>
      </div>

      <p className="text-sm text-forest-900/70 mt-8 leading-relaxed">
        Own several branches? Email us how many locations you have and where, and we&apos;ll send per-location pricing.
      </p>
    </section>
    <FaqSection items={CONTACT_FAQ} className="max-w-2xl mx-auto px-5 sm:px-8 pb-16" heading="Contact questions, answered" />
    </>
  );
}
