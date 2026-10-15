import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { ProspectScanner } from "@/components/ProspectScanner";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Prospect scanner",
  robots: { index: false, follow: false },
};

export default async function ProspectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/concierge");

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <Link href="/concierge" className="text-sm text-forest-900/70 hover:text-forest-900 mb-6 inline-flex items-center gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Concierge console
      </Link>

      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-2">Internal</div>
        <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-2">Prospect scanner</h1>
        <p className="text-sm text-forest-900/60 leading-relaxed max-w-2xl">
          Paste a list of local businesses and scan them all. Ranked by <strong>opportunity</strong> — how big the
          answer-engine and local gap is, weighted by whether they clearly invest in their website. A business with a
          strong site that&apos;s still invisible for &ldquo;near me&rdquo; is the easiest sale you will ever make.
        </p>
      </div>

      <ProspectScanner />
    </div>
  );
}
