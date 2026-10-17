import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { CrewConsole } from "@/components/CrewConsole";
import { AlertsBanner } from "@/components/AlertsBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Growth Crew", robots: { index: false, follow: false } };

export default async function CrewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/concierge");

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
      <Link href="/concierge" className="text-xs text-forest-900/65 hover:text-forest-900">← Concierge console</Link>
      <div className="mt-3 mb-8">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-2">Internal</div>
        <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-2">Growth Crew</h1>
        <p className="text-sm text-forest-900/70 leading-relaxed max-w-2xl">
          A planner, four specialists and a fact-checker work toward each client&apos;s goal. Every draft is checked by rules and an
          independent reviewer, website edits are measured with the real audit, and risky changes wait for the owner.
        </p>
      </div>
      <AlertsBanner />
      <CrewConsole />
    </div>
  );
}
