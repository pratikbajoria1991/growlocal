// WhatsApp Business Cloud API — inbound webhook handling and consent-gated sends.
//
// Meta only allows business-initiated messages to people who opted in, and only
// as approved templates; free-form text is allowed for 24h after they message us.
// Those rules are enforced here so a script can't bypass them by accident.

import crypto from "crypto";
import { get, set, push } from "@/lib/store";
import { classifyReply } from "@/lib/typesafe";

const GRAPH = "https://graph.facebook.com/v21.0";
const DAY_MS = 24 * 60 * 60 * 1000;

export const whatsappConfigured = () =>
  Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

export const normalizePhone = (p) => {
  const d = String(p || "").replace(/\D/g, "");
  return d.length === 10 ? "91" + d : d;
};

export function verifySignature(rawBody, header) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const key = (phone) => `wa:contact:${phone}`;
export const getContact = async (phone) => (await get(key(phone))) || {};
const saveContact = (phone, c) => set(key(phone), c);

export async function recordOptIn(phone, source) {
  const p = normalizePhone(phone);
  const c = await getContact(p);
  await saveContact(p, { ...c, optIn: true, optInSource: source, optInAt: new Date().toISOString(), stopped: false });
}

const STOP = /^\s*(stop|unsubscribe|opt ?out|cancel)\s*[.!]?\s*$/i;

// Called for each inbound message. A reply opens the 24h window; STOP closes everything.
export async function handleInbound(msg) {
  const phone = normalizePhone(msg.from);
  const text = msg.text?.body || msg.button?.text || "";
  const c = await getContact(phone);
  const now = new Date().toISOString();
  const hardStop = STOP.test(text);
  // Jev reads intent in any language; a confident "stop" is honoured too. Low
  // confidence never triggers anything automatic — it goes to a human.
  const read = hardStop ? null : await classifyReply(text);
  const stop = hardStop || (read?.intent === "stop" && read.confidence >= 0.8);
  const needsHuman = !stop && (!read || read.confidence < 0.7);
  if (stop) await saveContact(phone, { ...c, stopped: true, stoppedAt: now });
  else await saveContact(phone, { ...c, lastInboundAt: now, replied: true, intent: read?.intent || null, needsHuman });
  await push("wa:inbox", { phone, id: msg.id, text: text.slice(0, 1000), at: now, stop, intent: read?.intent || (hardStop ? "stop" : null), confidence: read?.confidence ?? null, needsHuman });
}

function canSend(c, kind) {
  if (c.stopped) return "This number opted out.";
  const windowOpen = c.lastInboundAt && Date.now() - Date.parse(c.lastInboundAt) < DAY_MS;
  if (kind === "text") return windowOpen ? null : "24h reply window is closed — send an approved template instead.";
  return c.optIn || c.lastInboundAt ? null : "No opt-in on record for this number.";
}

async function graph(body) {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || `WhatsApp HTTP ${res.status}`), { code: data?.error?.code });
  return data;
}

/** kind "text": { text }. kind "template": { template, lang, params: string[] } */
export async function sendMessage(to, kind, opts) {
  if (!whatsappConfigured()) throw Object.assign(new Error("WhatsApp is not configured."), { code: "not_configured" });
  const phone = normalizePhone(to);
  const refusal = canSend(await getContact(phone), kind);
  if (refusal) throw Object.assign(new Error(refusal), { code: "consent" });

  const body = kind === "text"
    ? { to: phone, type: "text", text: { body: String(opts.text).slice(0, 4000) } }
    : {
        to: phone, type: "template",
        template: {
          name: opts.template, language: { code: opts.lang || "en" },
          components: opts.params?.length ? [{ type: "body", parameters: opts.params.map((t) => ({ type: "text", text: String(t) })) }] : [],
        },
      };
  const data = await graph(body);
  await push("wa:sent", { phone, kind, template: opts.template || null, id: data.messages?.[0]?.id, at: new Date().toISOString() });
  return data;
}
