// Pluggable key-value store.
//
// Production (Vercel): uses Upstash Redis REST when KV_REST_API_URL is set —
// works across serverless invocations.
// Local dev: falls back to the filesystem under .data/.
// Neither configured: reports unavailable so callers can degrade gracefully
// instead of silently losing data.

import fs from "fs";
import path from "path";

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const isServerless = Boolean(process.env.VERCEL);
const DATA_DIR = path.join(process.cwd(), ".data");

export const storeMode = KV_URL && KV_TOKEN ? "kv" : isServerless ? "none" : "fs";
export const storeAvailable = storeMode !== "none";

// ---------- KV backend ----------
async function kvFetch(command) {
  const res = await fetch(`${KV_URL}/${command.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV error ${res.status}`);
  return (await res.json()).result;
}

async function kvPipeline(commands) {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV pipeline error ${res.status}`);
  return res.json();
}

// ---------- FS backend ----------
function fsPath(key) {
  return path.join(DATA_DIR, `${key.replace(/[^a-zA-Z0-9:_-]/g, "_")}.json`);
}

// ---------- public API ----------
export async function get(key) {
  if (storeMode === "kv") {
    const raw = await kvFetch(["get", key]);
    return raw ? JSON.parse(raw) : null;
  }
  if (storeMode === "fs") {
    const f = fsPath(key);
    if (!fs.existsSync(f)) return null;
    try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; }
  }
  return null;
}

export async function set(key, value) {
  if (storeMode === "kv") {
    await kvFetch(["set", key, JSON.stringify(value)]);
    return value;
  }
  if (storeMode === "fs") {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(fsPath(key), JSON.stringify(value, null, 2));
    return value;
  }
  throw new Error("No persistent store configured");
}

export async function del(key) {
  if (storeMode === "kv") { await kvFetch(["del", key]); return true; }
  if (storeMode === "fs") {
    const f = fsPath(key);
    if (fs.existsSync(f)) { fs.unlinkSync(f); return true; }
    return false;
  }
  return false;
}

// Append to a list (used for the waitlist).
export async function push(listKey, value) {
  if (storeMode === "kv") {
    await kvFetch(["rpush", listKey, JSON.stringify(value)]);
    return true;
  }
  if (storeMode === "fs") {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const f = path.join(DATA_DIR, `${listKey.replace(/[^a-zA-Z0-9:_-]/g, "_")}.jsonl`);
    fs.appendFileSync(f, JSON.stringify(value) + "\n");
    return true;
  }
  throw new Error("No persistent store configured");
}
