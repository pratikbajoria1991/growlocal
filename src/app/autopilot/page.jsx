import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Lock, KeyRound, FileText, MessageSquare, HelpCircle, BarChart3 } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "GBP Autopilot — AI agent for your Google Business Profile",
  description: "Connect your Google Business Profile once. An AI agent drafts weekly posts, replies to every review, builds your FAQ schema, and ships a monthly report. You approve, it publishes.",
};

const ACTIONS = [
  { icon: FileText, title: "Weekly GBP posts", body: "Two posts a week, drafted from your actual services and seasonality — with photo suggestions and the right CTA button for each." },
  { icon: MessageSquare, title: "Review replies", body: "Every new review gets a personalised draft reply within hours. Negative reviews get escalated to you first, never auto-published." },
  { icon: HelpCircle, title: "FAQ + schema", body: "15-25 real customer questions with FAQPage JSON-LD, ready to paste into your site. This is what gets you cited by AI answer engines." },
  { icon: BarChart3, title: "Monthly report", body: "On the 1st: what we published, what moved in your Insights, and three specific actions for the coming month." },
];

export default function Autopilot() {
  return (
    <>
      <section className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/12 border border-lime-500/25 text-xs text-lime-600 font-medium mb-6">
            <ShieldCheck className="w-3 h-3" /> Secure OAuth · You approve everything
          </div>
          <h1 className="font-display text-4xl sm:text-6xl leading-[1.02] tracking-tight mb-5">
            Put your Google Business Profile on <span className="text-lime-600">autopilot.</span>
          </h1>
          <p className="text-lg text-forest-900/60 mb-8 max-w-2xl leading-relaxed">
            Connect once. An AI agent handles the weekly grind — posts, review replies, FAQ content, monthly reporting. Everything arrives as a draft for your approval. Nothing publishes without you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/login?plan=autopilot" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-forest-900 text-canvas-50 font-medium hover:bg-forest-800 transition-colors">
              Connect your profile <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border hairline bg-white hover:bg-forest-900/[0.03] font-medium transition-colors">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">What the agent does</div>
        <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-9 max-w-xl">Four jobs, every month, without you touching them.</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {ACTIONS.map((a) => (
            <div key={a.title} className="rounded-4xl border hairline bg-white p-7">
              <div className="w-10 h-10 rounded-xl bg-lime-500/12 flex items-center justify-center mb-4">
                <a.icon className="w-5 h-5 text-lime-600" />
              </div>
              <h3 className="font-display text-lg mb-2">{a.title}</h3>
              <p className="text-sm text-forest-900/60 leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14 border-t hairline">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">Access &amp; security</div>
        <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-8 max-w-xl">You never share a password.</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Lock, t: "Google handles sign-in", d: "You authorise through Google's own consent screen. Your credentials never touch our servers." },
            { icon: KeyRound, t: "Revoke in one click", d: "Remove our access anytime from myaccount.google.com/permissions. No email, no support ticket." },
            { icon: ShieldCheck, t: "Encrypted at rest", d: "The refresh token Google issues is encrypted with AES-256-GCM before it's stored." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border hairline bg-white p-5">
              <x.icon className="w-4.5 h-4.5 text-lime-600 mb-2.5" />
              <div className="font-medium text-sm mb-1.5">{x.t}</div>
              <p className="text-xs text-forest-900/60 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-14">
        <div className="rounded-4xl bg-forest-900 text-canvas-50 p-10 sm:p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 70% at 85% 0%, rgba(126,226,62,0.35), transparent 70%)" }} />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl mb-4">Not sure yet? Audit first.</h2>
            <p className="text-canvas-50/70 mb-7 max-w-lg leading-relaxed">
              Run the free visibility audit on your website. It costs nothing and shows you exactly what Autopilot would be fixing.
            </p>
            <Link href="/audit" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-lime-500 text-forest-900 font-semibold hover:bg-lime-400 transition-colors">
              Run free audit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
