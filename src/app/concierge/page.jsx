import Link from "next/link";
import { redirect } from "next/navigation";
import { Radar, FileText } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { ConciergeConsole } from "@/components/ConciergeConsole";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Concierge console",
  robots: { index: false, follow: false },
};

export default async function ConciergePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isAdmin(user)) {
    return (
      <div className="max-w-lg mx-auto px-5 sm:px-8 py-20">
        <h1 className="font-display text-2xl mb-2">Not authorised</h1>
        <p className="text-sm text-forest-900/60 leading-relaxed">
          This is an internal console. If it should be yours, add {user.email} to the{" "}
          <code className="text-xs bg-forest-900/5 px-1.5 py-0.5 rounded">ADMIN_EMAILS</code> environment variable.
        </p>
      </div>
    );
  }

  const hasKey = Boolean(process.env.GEMINI_API_KEY);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-2">Internal</div>
          <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-2">Concierge console</h1>
          <p className="text-sm text-forest-900/60 leading-relaxed max-w-2xl">
            Run Growlocal Managed. Plan each client&apos;s week, get owner approval on risky changes, log what shipped and
            record their Google numbers at day 7, 28 and 56. Every week, ask: which of these could the software do without me?
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/concierge/proposals"
            className="px-4 py-2.5 rounded-xl btn-premium text-white text-sm font-medium inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Proposals
          </Link>
          <Link
            href="/concierge/prospects"
            className="px-4 py-2.5 rounded-xl border hairline bg-white hover:bg-forest-900/[0.03] text-sm font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Radar className="w-4 h-4 text-indigo-600" /> Prospect scanner
          </Link>
        </div>
      </div>

      {!hasKey && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4 mb-8 text-sm text-forest-900/75 leading-relaxed">
          <strong>No GEMINI_API_KEY set</strong> — content actions will return clearly-labelled stubs, not real drafts.
          Audits still work, because those don&apos;t use the model.
        </div>
      )}

      <ConciergeConsole />
    </div>
  );
}
