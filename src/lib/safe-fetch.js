// Fetching URLs that strangers type into a public form.
//
// A visitor controls the URL, so every request (including each redirect hop)
// is refused if the host points at a private, loopback, link-local or
// metadata address. Otherwise anyone could use our server to probe internal
// networks. The check runs twice: once up front for a clear error message,
// and again inside the connection's own DNS lookup, so a domain that answers
// "public" the first time and "internal" the second (DNS rebinding) is still
// refused.

import dns from "node:dns";
import net from "node:net";
import { Agent } from "undici";

function isPrivateV4(ip) {
  const p = ip.split(".").map(Number);
  const n = ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
  const inRange = (base, bits) => {
    const b = base.split(".").map(Number);
    const bn = ((b[0] << 24) >>> 0) + (b[1] << 16) + (b[2] << 8) + b[3];
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return ((n & mask) >>> 0) === ((bn & mask) >>> 0);
  };
  return [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
    ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 4], ["240.0.0.0", 4],
  ].some(([b, bits]) => inRange(b, bits));
}

// Expand an IPv6 address to 8 numeric groups (handles "::" and a trailing
// dotted IPv4 part).
function v6Groups(ip) {
  let x = ip.toLowerCase().split("%")[0];
  const dotted = x.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const p = dotted[1].split(".").map(Number);
    x = x.slice(0, -dotted[1].length) + `${((p[0] << 8) | p[1]).toString(16)}:${((p[2] << 8) | p[3]).toString(16)}`;
  }
  const [head, tail] = x.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined && tail ? tail.split(":") : [];
  const fill = x.includes("::") ? Array(8 - h.length - t.length).fill("0") : [];
  return [...h, ...fill, ...t].map((g) => parseInt(g || "0", 16));
}

function isPrivateV6(ip) {
  const g = v6Groups(ip);
  if (g.length !== 8 || g.some((n) => Number.isNaN(n))) return true; // unparseable: refuse
  const v4 = () => `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
  if (g.every((n) => n === 0)) return true; // ::
  if (g.slice(0, 7).every((n) => n === 0) && g[7] === 1) return true; // ::1
  if (g.slice(0, 5).every((n) => n === 0) && g[5] === 0xffff) return isPrivateV4(v4()); // ::ffff:a.b.c.d
  if (g.slice(0, 6).every((n) => n === 0)) return isPrivateV4(v4()); // ::a.b.c.d (deprecated compat)
  if (g[0] === 0x64 && g[1] === 0xff9b) return isPrivateV4(v4()); // NAT64
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80 || (g[0] & 0xffc0) === 0xfec0) return true; // link- and site-local
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  return false;
}

const isPrivate = (address, family) =>
  (family === 4 || family === "IPv4") ? isPrivateV4(address) : isPrivateV6(address);

export class FetchBlockedError extends Error {}

const BLOCKED = "That address isn't a public website.";

export async function assertPublicHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (/^localhost$|\.localhost$|\.local$|\.internal$/i.test(host)) throw new FetchBlockedError(BLOCKED);
  const addrs = net.isIP(host)
    ? [{ address: host, family: net.isIP(host) }]
    : await dns.promises.lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new FetchBlockedError("We couldn't find that domain. Check the spelling.");
  for (const a of addrs) if (isPrivate(a.address, a.family)) throw new FetchBlockedError(BLOCKED);
}

// The DNS lookup the connection actually uses: refuses private answers at
// connect time, closing the gap between the check above and the request.
function guardedLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
    if (err) return callback(err);
    const bad = addrs.find((a) => isPrivate(a.address, a.family));
    if (bad) return callback(new FetchBlockedError(BLOCKED));
    if (options?.all) return callback(null, addrs);
    callback(null, addrs[0].address, addrs[0].family);
  });
}

const dispatcher = new Agent({ connect: { lookup: guardedLookup } });

function isBlockedCause(e) {
  for (let c = e; c; c = c.cause) if (c instanceof FetchBlockedError) return true;
  return false;
}

/**
 * GET a public URL safely. Follows up to 4 redirects, re-checking each hop.
 * The timeout covers the whole request, body included.
 * `redirects` lists each hop taken ({from, status}) before the final `url`.
 * @returns {Promise<{ok:boolean,status:number,url:string,body:string,headers:Headers|null,redirects:Array,truncated?:boolean,timedOut?:boolean,error?:string}>}
 */
export async function safeFetch(rawUrl, { timeoutMs = 9000, maxBytes = 1_500_000, accept = "text/html,*/*", headers: extra = null } = {}) {
  let url;
  try { url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`); } catch { throw new FetchBlockedError("That doesn't look like a valid URL."); }
  const redirects = [];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const fail = (extraFields) => ({ ok: false, status: 0, url: url.href, body: "", headers: null, redirects, ...extraFields });
  try {
    for (let hop = 0; hop <= 4; hop++) {
      if (!/^https?:$/.test(url.protocol)) throw new FetchBlockedError("Only http and https links are supported.");
      if (url.port && !["80", "443"].includes(url.port)) throw new FetchBlockedError("Only standard web ports are supported.");
      await assertPublicHost(url.hostname);
      let res;
      try {
        res = await fetch(url.href, {
          redirect: "manual",
          signal: ctrl.signal,
          dispatcher,
          headers: extra || { "user-agent": "Mozilla/5.0 (compatible; GrowlocalBot/1.0; +https://growlocal-delta.vercel.app)", accept },
        });
      } catch (e) {
        if (isBlockedCause(e)) throw new FetchBlockedError(BLOCKED);
        if (e.name === "AbortError") return fail({ timedOut: true });
        return fail({ error: String(e.cause?.code || e.message || "") });
      }
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        res.body?.cancel().catch(() => {});
        redirects.push({ from: url.href, status: res.status });
        url = new URL(res.headers.get("location"), url);
        continue;
      }
      const reader = res.body?.getReader();
      let received = 0;
      let truncated = false;
      const chunks = [];
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.length;
            chunks.push(value);
            if (received > maxBytes) { truncated = true; await reader.cancel(); break; }
          }
        } catch (e) {
          if (e.name === "AbortError") return fail({ status: res.status, timedOut: true });
          throw e;
        }
      }
      const body = new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))).subarray(0, maxBytes));
      return { ok: res.ok, status: res.status, url: url.href, body, headers: res.headers, redirects, truncated };
    }
    return fail({ tooManyRedirects: true });
  } finally {
    clearTimeout(timer);
  }
}
