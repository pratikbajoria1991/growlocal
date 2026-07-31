import { Mail, MessageSquare } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Contact", description: `Get in touch with ${BRAND.name}.` };

export default function Contact() {
  return (
    <section className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
      <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">Contact</div>
      <h1 className="font-display text-4xl sm:text-5xl leading-tight mb-4">Talk to us.</h1>
      <p className="text-lg text-forest-900/60 leading-relaxed mb-9">
        Questions about the audit, Autopilot, or agency plans? Email is the fastest route — we reply within one business day.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <a href={`mailto:${BRAND.email}`} className="rounded-2xl border hairline bg-white p-6 hover:border-lime-500/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-lime-500/12 flex items-center justify-center mb-3">
            <Mail className="w-4 h-4 text-lime-600" />
          </div>
          <div className="font-medium text-sm mb-1">General</div>
          <div className="text-sm text-lime-600">{BRAND.email}</div>
        </a>
        <a href={`mailto:${BRAND.supportEmail}`} className="rounded-2xl border hairline bg-white p-6 hover:border-lime-500/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-lime-500/12 flex items-center justify-center mb-3">
            <MessageSquare className="w-4 h-4 text-lime-600" />
          </div>
          <div className="font-medium text-sm mb-1">Support</div>
          <div className="text-sm text-lime-600">{BRAND.supportEmail}</div>
        </a>
      </div>

      <p className="text-sm text-forest-900/50 mt-8 leading-relaxed">
        For agency plans covering more than 10 profiles, email us with your locations count and we&apos;ll send custom pricing.
      </p>
    </section>
  );
}
