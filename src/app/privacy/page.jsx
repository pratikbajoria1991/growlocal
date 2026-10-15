import { BRAND } from "@/lib/brand";

export const metadata = { title: "Privacy Policy", description: `How ${BRAND.name} collects, uses and protects your data.` };

const EFFECTIVE = "13 September 2026";

export default function Privacy() {
  return (
    <article className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
      <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">Legal</div>
      <h1 className="font-display text-4xl sm:text-5xl leading-tight mb-3">Privacy Policy</h1>
      <p className="text-sm text-forest-900/65 mb-10">Effective {EFFECTIVE}</p>

      <div className="space-y-8 text-forest-900/80 leading-relaxed">
        <S n="1" t="Who we are">
          <p>{BRAND.name} is a done-for-you local marketing service operated from {BRAND.country}. Contact us at <a href={`mailto:${BRAND.email}`} className="text-indigo-600 underline">{BRAND.email}</a>.</p>
          <p>We comply with India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act).</p>
        </S>

        <S n="2" t="What we collect">
          <p><strong>When you run an audit:</strong> the URL you submit. We fetch that page and analyse its public HTML. We do not store audit results tied to your identity unless you are signed in.</p>
          <p>If the site blocks our direct request (some use bot protection that rejects automated traffic), we retry once through a third-party reader service, <a href="https://jina.ai" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">r.jina.ai</a>. Only the public URL is sent — never your email, account, or any personal data. If you use the paste-HTML option instead, the markup you paste is processed in memory and never stored.</p>
          <p><strong>When you create an account:</strong> your email address. We use magic links, so we never collect or store a password.</p>
          <p><strong>When you apply for Growlocal Managed:</strong> your business name, email, and optionally a WhatsApp number and website or Maps link. We use these only to review your application and contact you about it.</p>
          <p><strong>When you become a client:</strong> the business details you share with us, a log of every change we make for you, any approvals you give (including approvals sent on WhatsApp or email), and the performance numbers from your Google Business Profile that we record to report results.</p>
          <p><strong>When you connect Google Business Profile:</strong> an OAuth refresh token issued by Google, encrypted at rest with AES-256-GCM. We never see or receive your Google password.</p>
          <p><strong>Automatically:</strong> standard server logs (IP, user agent, timestamp, path). No third-party advertising or tracking cookies.</p>
        </S>

        <S n="3" t="Google API disclosure">
          <p>{BRAND.name}&apos;s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
          <p>We request the <code className="text-xs bg-forest-900/5 px-1.5 py-0.5 rounded">business.manage</code> scope in order to read your profile information and Insights, and to make the changes described in our Terms on your behalf. Changes that require your approval under the Terms are never made without it.</p>
          <p>Until Google approves that access, managed clients instead add us as a Manager from their own Business Profile settings. Google controls that permission, and you can remove it from the same screen at any time.</p>
          <p>You can revoke our access at any time at <a href="https://myaccount.google.com/permissions" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.</p>
        </S>

        <S n="4" t="How we use your data">
          <p>Only to deliver the service: run audits, plan and carry out work for your business, report results to you, maintain your session, and communicate about your account. We do not sell your data, share it with brokers, or use it to train third-party AI models.</p>
          <p>When the AI agent generates content, the relevant business context is sent to Google&apos;s Gemini API using a billing-enabled key. On that paid tier, Google&apos;s terms do not use submitted content to train their models — this protection does not apply to Google&apos;s free API tier, which is why we don&apos;t use it.</p>
        </S>

        <S n="5" t="Retention">
          <p>Account data is retained while your account is active. On deletion, we remove your OAuth tokens immediately and all remaining personal data within 30 days, except where law requires retention.</p>
        </S>

        <S n="6" t="Your rights">
          <p>Under the DPDP Act you may access, correct, or erase your data, withdraw consent, or nominate someone to exercise these rights on your behalf. Email <a href={`mailto:${BRAND.email}`} className="text-indigo-600 underline">{BRAND.email}</a> with the subject &quot;DPDP Request&quot; — we respond within 30 days.</p>
        </S>

        <S n="7" t="Security">
          <p>TLS in transit. AES-256-GCM for OAuth tokens at rest. Session cookies are HttpOnly, SameSite=Lax and signed with HMAC-SHA256.</p>
        </S>

        <S n="8" t="Changes">
          <p>Material changes are announced by email to registered users and posted here for 30 days before taking effect.</p>
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
