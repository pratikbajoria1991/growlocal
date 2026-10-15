import { BRAND } from "@/lib/brand";

export const metadata = { title: "Terms of Service", description: `The agreement between you and ${BRAND.name}.` };

const EFFECTIVE = "13 September 2026";

export default function Terms() {
  return (
    <article className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
      <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">Legal</div>
      <h1 className="font-display text-4xl sm:text-5xl leading-tight mb-3">Terms of Service</h1>
      <p className="text-sm text-forest-900/65 mb-10">Effective {EFFECTIVE}</p>

      <div className="space-y-8 text-forest-900/80 leading-relaxed">
        <S n="1" t="Acceptance">
          <p>By using {BRAND.name} you agree to these terms. If you do not agree, do not use the service.</p>
        </S>

        <S n="2" t="The audit tool">
          <p>Audits are provided free and &quot;as is&quot;. Scores are directional estimates based on the public HTML of the URL you submit, measured against published best practices. We make no warranty that implementing a recommendation will produce a specific ranking, traffic level, or business outcome.</p>
          <p>You may audit any website you own or have authority to audit. You may not scrape, resell, or systematically republish audit output.</p>
        </S>

        <S n="3" t="Growlocal Managed">
          <p>Growlocal Managed is a done-for-you service. With the Manager access you grant on your Google Business Profile, and any website access you choose to give, we carry out routine work on your behalf: posts, replies to positive reviews, services and attributes, FAQ and schema markup, and directory listings.</p>
          <p>We will not make the following changes without your explicit approval: your business name, category, address, hours or description; replies to negative or health-related reviews; and new or rewritten website pages or articles. Approval may be given in your dashboard or in writing on WhatsApp or email, and we keep a record of it.</p>
          <p>Every change we make is logged and visible to you. You can remove our access at any time from your Business Profile settings.</p>
          <p>Plans bill monthly in advance and cancel with 30 days notice. Prices exclude GST.</p>
        </S>

        <S n="4" t="Your responsibilities">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You have the right to grant access to any Google Business Profile or website you give us access to.</li>
            <li>The business information you provide is accurate and not misleading.</li>
            <li>You will not use the service to publish false reviews, fabricated testimonials, or deceptive content.</li>
          </ul>
        </S>

        <S n="5" t="What we will not do">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Generate or purchase fake reviews.</li>
            <li>Make an approval-required change (listed in section 3) without your explicit approval.</li>
            <li>Use techniques that violate Google&apos;s guidelines.</li>
            <li>Guarantee rankings, traffic, or revenue.</li>
            <li>Share your data or OAuth tokens with third parties beyond the processors named in our Privacy Policy.</li>
          </ul>
        </S>

        <S n="6" t="Availability">
          <p>We aim for high availability but do not guarantee uninterrupted service. We may modify or discontinue features with reasonable notice.</p>
        </S>

        <S n="7" t="Limitation of liability">
          <p>To the maximum extent permitted by law, our total liability is capped at the fees you paid us in the twelve months preceding the claim. We are not liable for indirect or consequential damages, including lost profits or business opportunity.</p>
        </S>

        <S n="8" t="Governing law">
          <p>These terms are governed by the laws of India. Disputes will be resolved in the courts of India.</p>
        </S>

        <S n="9" t="Contact">
          <p>Questions? <a href={`mailto:${BRAND.email}`} className="text-indigo-600 underline">{BRAND.email}</a></p>
        </S>
      </div>
    </article>
  );
}

function S({ n, t, children }) {
  return (
    <section>
      <h2 className="font-display text-xl mb-3"><span className="text-indigo-600 mr-2">{n}.</span>{t}</h2>
      <div className="space-y-2.5 text-[15px]">{children}</div>
    </section>
  );
}
