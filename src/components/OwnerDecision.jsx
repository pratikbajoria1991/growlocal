"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

export function OwnerDecision({ clientId, actionId }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  async function decide(decision) {
    setBusy(decision); setError(null);
    const res = await fetch("/api/owner/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, actionId, decision, note }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return setError(data.error);
    router.refresh();
  }

  return (
    <div className="space-y-2.5">
      <input
        value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Anything to change? (optional)"
        className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-canvas-50 text-sm outline-none focus:border-indigo-500/60"
      />
      <div className="flex gap-2">
        <button
          onClick={() => decide("approved")} disabled={Boolean(busy)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {busy === "approved" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
        </button>
        <button
          onClick={() => decide("declined")} disabled={Boolean(busy)}
          className="px-4 py-2.5 rounded-xl border hairline bg-white text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {busy === "declined" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Don&apos;t do this
        </button>
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  );
}
