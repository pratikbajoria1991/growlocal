// Outbound notifications: email (Resend) and operator failure alerts.
//
// Email needs RESEND_API_KEY and MAIL_FROM (a sender on a domain verified in
// Resend). Alerts go to ALERT_EMAILS (falls back to ADMIN_EMAILS) and, when
// WhatsApp is configured, to ALERT_WHATSAPP. Every alert is also kept in the
// store so the console shows it even when no channel is set up.

import { get, set } from "./store";
import { sendMessage, whatsappConfigured } from "./whatsapp";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

/** Returns { sent: true } or { sent: false, reason }. Never throws. */
export async function sendEmail({ to, subject, text }) {
  if (!emailConfigured()) return { sent: false, reason: "Email isn't configured (RESEND_API_KEY, MAIL_FROM)." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: Array.isArray(to) ? to : [to], subject: String(subject).slice(0, 200), text: String(text).slice(0, 10000) }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return { sent: false, reason: d?.message || `Resend returned ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e.message };
  }
}

const ALERTS_KEY = "alerts:log";
const DEDUPE_MS = 6 * 3_600_000;
const list = (v) => String(v || "").split(",").map((x) => x.trim()).filter(Boolean);

export async function listAlerts() {
  return (await get(ALERTS_KEY)) || [];
}

export async function ackAlerts() {
  const all = await listAlerts();
  await set(ALERTS_KEY, all.map((a) => ({ ...a, ack: true })));
}

/**
 * Records and sends an operator alert. The same source + title within 6 hours
 * is counted, not re-sent, so a recurring failure doesn't flood the inbox.
 * Never throws: an alert failing must not break the job that raised it.
 */
export async function alert({ source, title, detail = "", clientId = null }) {
  try {
    const now = Date.now();
    const all = await listAlerts();
    const dup = all.find((a) => a.source === source && a.title === title && now - Date.parse(a.at) < DEDUPE_MS);
    if (dup) {
      dup.count = (dup.count || 1) + 1;
      dup.lastAt = new Date(now).toISOString();
      await set(ALERTS_KEY, all);
      return { deduped: true };
    }
    const entry = { id: now.toString(36), at: new Date(now).toISOString(), source, title: String(title).slice(0, 200), detail: String(detail).slice(0, 2000), clientId, count: 1, ack: false, delivered: [] };

    const emails = list(process.env.ALERT_EMAILS || process.env.ADMIN_EMAILS);
    if (emails.length) {
      const r = await sendEmail({ to: emails, subject: `[Growlocal alert] ${entry.title}`, text: `${entry.title}\n\nSource: ${source}${clientId ? `\nClient: ${clientId}` : ""}\nTime: ${entry.at}\n\n${entry.detail}\n\nOpen the console: ${process.env.NEXT_PUBLIC_APP_URL || ""}/concierge` });
      entry.delivered.push({ channel: "email", ...r });
    }
    const wa = list(process.env.ALERT_WHATSAPP);
    if (wa.length && whatsappConfigured()) {
      for (const to of wa) {
        try { await sendMessage(to, "text", { text: `Growlocal alert: ${entry.title}\n${entry.detail.slice(0, 500)}` }); entry.delivered.push({ channel: "whatsapp", sent: true }); }
        catch (e) { entry.delivered.push({ channel: "whatsapp", sent: false, reason: e.message }); }
      }
    }
    await set(ALERTS_KEY, [entry, ...all].slice(0, 100));
    return entry;
  } catch (e) {
    console.error("[alert] failed to record alert:", e.message, { source, title });
    return null;
  }
}
