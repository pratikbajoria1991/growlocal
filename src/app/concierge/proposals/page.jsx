import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { placesProvider } from "@/lib/places";
import { ConciergeProposals } from "@/components/ConciergeProposals";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proposals", robots: { index: false, follow: false } };

export default async function ProposalsAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/concierge");

  const provider = placesProvider();

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <Link href="/concierge" className="text-xs text-forest-900/65 hover:text-forest-900">← Concierge console</Link>
      <h1 className="font-display text-3xl sm:text-4xl leading-tight mt-3 mb-2">Proposals</h1>
      <p className="text-sm text-forest-900/60 leading-relaxed max-w-2xl mb-6">
        Generate a proposal for a lead, send them the link with the outbound message, and when they sign, load the
        four-week plan straight into their work log.
      </p>
      {!provider && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4 mb-6 text-sm">
          No Maps data source configured — set <code>COMPOSIO_API_KEY</code> or <code>GOOGLE_PLACES_API_KEY</code>.
        </div>
      )}
      <ConciergeProposals />
    </div>
  );
}
