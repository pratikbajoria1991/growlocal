import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { clientsForOwner } from "@/lib/clients";
import { OnboardingForm } from "@/components/OnboardingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up your business", robots: { index: false, follow: false } };

export default async function OnboardingPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = (await clientsForOwner(user.email)).find((c) => c.id === id);
  if (!business) notFound();

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
      <Link href="/app" className="inline-flex items-center gap-1.5 text-sm text-forest-900/70 hover:text-forest-900 mb-6">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to your dashboard
      </Link>
      <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-[-0.04em] leading-tight mb-2">Set up {business.name}</h1>
      <p className="text-forest-900/70 mb-8">About 10 minutes. Everything here is used only to market your business.</p>
      <OnboardingForm clientId={business.id} businessName={business.name} initial={business.onboarding} initialConsent={business.consent} />
    </div>
  );
}
