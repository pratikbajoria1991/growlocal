"use client";
// Unread operator alerts (failed runs, tracking errors, undelivered sign-in
// email) at the top of the console, with where they were delivered.
import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, Check } from "lucide-react";

export function AlertsBanner() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/concierge/alerts").then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);

  if (!data) return null;
  const unread = data.alerts.filter((a) => !a.ack);
  const noChannel = !data.channels.email && !data.channels.whatsapp;
  if (!unread.length && !noChannel) return null;

  async function ack() {
    await fetch("/api/concierge/alerts", { method: "POST" });
    setData({ ...data, alerts: data.alerts.map((a) => ({ ...a, ack: true })) });
  }

  return (
    <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/[0.07] p-4 text-sm">
      {noChannel && (
        <p className="text-amber-900 mb-2">
          Alerts aren&apos;t being delivered anywhere yet. Set RESEND_API_KEY and MAIL_FROM (email to ALERT_EMAILS or ADMIN_EMAILS) in Vercel; until then they only appear here.
        </p>
      )}
      {unread.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 font-semibold text-amber-900" aria-expanded={open}>
              <AlertTriangle className="w-4 h-4" aria-hidden="true" /> {unread.length} unread alert{unread.length === 1 ? "" : "s"}
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <button type="button" onClick={ack} className="text-xs px-3 py-1.5 rounded-lg border hairline bg-white inline-flex items-center gap-1"><Check className="w-3 h-3" /> Mark all read</button>
          </div>
          {open && (
            <ul className="mt-3 space-y-2">
              {unread.map((a) => (
                <li key={a.id} className="rounded-xl bg-white border hairline p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">{a.title}{a.count > 1 ? ` (×${a.count})` : ""}</span>
                    <span className="text-xs text-forest-900/65">{a.source} · {new Date(a.lastAt || a.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {a.detail && <p className="text-xs text-forest-900/75 mt-1 whitespace-pre-wrap">{a.detail}</p>}
                  {a.delivered?.length > 0 && <p className="text-[11px] text-forest-900/60 mt-1">Delivered: {a.delivered.map((d) => `${d.channel} ${d.sent ? "✓" : `✗ (${d.reason})`}`).join(" · ")}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
