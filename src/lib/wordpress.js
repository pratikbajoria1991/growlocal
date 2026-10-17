// WordPress website connector: backup, apply, verify, undo.
//
// Uses the WordPress REST API with an Application Password (Users > Profile >
// Application Passwords), which the owner can revoke at any time. Stored
// encrypted. Every change backs up the page first, re-reads the page to
// confirm it stuck, and logs a done action in the client's work log.
//
// Two kinds of change:
//   append_html     — add a block (FAQ section, JSON-LD schema) to a page.
//                     Allowed when the owner lets technical fixes go live
//                     (onboarding auto.websiteTech), otherwise needs approval.
//   replace_content — replace a page's wording. Always needs an approved
//                     "Website page change" action from the owner.
// SEO titles/meta descriptions live in plugin fields (Yoast, Rank Math) that
// their REST APIs don't let us write; that needs a companion plugin later.

import { get, set } from "./store";
import { sealJson, openJson } from "./oauth-store";
import { assertPublicHost } from "./safe-fetch";
import { createAction, updateAction, listActions } from "./ledger";

const connKey = (id) => `wp:conn:${id}`;
const backupKey = (id) => `wp:backups:${id}`;
const MARK = (id) => `<!-- growlocal:${id} -->`;

export class WpError extends Error {}

function normalizeSite(raw) {
  let u;
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { throw new WpError("That doesn't look like a website address."); }
  if (u.protocol !== "https:" && !allowPrivate()) throw new WpError("Use the site's https:// address. Passwords must not travel over plain http.");
  return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
}
// Local testing only: lets the connector reach a mock WordPress on localhost.
const allowPrivate = () => process.env.NODE_ENV !== "production" && process.env.WP_ALLOW_PRIVATE_HOSTS === "1";

async function wp(conn, path, { method = "GET", body } = {}) {
  const url = `${conn.site}/wp-json${path}`;
  if (!allowPrivate()) await assertPublicHost(new URL(url).hostname);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, {
      method,
      signal: ctrl.signal,
      redirect: "manual",
      headers: {
        Authorization: `Basic ${Buffer.from(`${conn.username}:${conn.appPassword}`).toString("base64")}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status >= 300 && res.status < 400) throw new WpError(`The site redirects to ${res.headers.get("location") || "another address"}. Connect using that address instead.`);
    const data = await res.json().catch(() => null);
    if (res.status === 401 || res.status === 403) throw new WpError(data?.message?.replace(/<[^>]+>/g, "") || "WordPress rejected the username or application password.");
    if (res.status === 404 && !data) throw new WpError("No WordPress REST API at that address. Is it a WordPress site with the REST API enabled?");
    if (!res.ok) throw new WpError(data?.message?.replace(/<[^>]+>/g, "") || `WordPress returned ${res.status}.`);
    return data;
  } catch (e) {
    if (e.name === "AbortError") throw new WpError("The website took too long to respond.");
    if (e instanceof WpError) throw e;
    if (e.message === "fetch failed") throw new WpError("Couldn't reach that website. Check the address and that the site is online.");
    throw new WpError(e.message);
  } finally {
    clearTimeout(t);
  }
}

/** Checks the credentials can edit pages. Returns { user, canEdit, plugins }. */
export async function testConnection({ site, username, appPassword }) {
  const conn = { site: normalizeSite(site), username: String(username || "").trim(), appPassword: String(appPassword || "").replace(/\s+/g, " ").trim() };
  if (!conn.username || conn.appPassword.length < 16) throw new WpError("Enter the WordPress username and a full application password.");
  const me = await wp(conn, "/wp/v2/users/me?context=edit");
  const caps = me.capabilities || {};
  const canEdit = Boolean(caps.edit_pages && caps.edit_published_pages);
  const index = await wp(conn, "/").catch(() => ({}));
  const ns = index.namespaces || [];
  return { conn, user: me.name || me.slug, canEdit, unfilteredHtml: Boolean(caps.unfiltered_html), plugins: { yoast: ns.includes("yoast/v1"), rankMath: ns.some((n) => n.startsWith("rankmath")) } };
}

export async function saveConnection(clientId, { conn, user, unfilteredHtml, plugins }) {
  await set(connKey(clientId), { site: conn.site, username: conn.username, secret: sealJson({ appPassword: conn.appPassword }), user, unfilteredHtml, plugins, connectedAt: new Date().toISOString() });
}

export async function getConnectionInfo(clientId) {
  const c = await get(connKey(clientId));
  if (!c) return null;
  const { secret, ...info } = c;
  return info;
}

async function loadConn(clientId) {
  const c = await get(connKey(clientId));
  if (!c) throw new WpError("This client's website isn't connected.");
  return { site: c.site, username: c.username, appPassword: openJson(c.secret).appPassword, unfilteredHtml: c.unfilteredHtml };
}

export async function disconnect(clientId) {
  await set(connKey(clientId), null);
}

export async function listPages(clientId) {
  const conn = await loadConn(clientId);
  const pages = await wp(conn, "/wp/v2/pages?per_page=100&context=edit&_fields=id,title,link,status,modified");
  return (pages || []).map((p) => ({ id: p.id, title: p.title?.raw || p.title?.rendered || `Page ${p.id}`, link: p.link, status: p.status, modified: p.modified }));
}

export async function listBackups(clientId) {
  return (await get(backupKey(clientId))) || [];
}

function policyCheck(client, kind, actions, actionId) {
  const approved = actionId && actions.find((a) => a.id === actionId && a.approval?.decision === "approved");
  if (kind === "replace_content") {
    if (!approved) throw new WpError("Replacing page wording needs an owner-approved \"Website page change\" in the work log. Pick that approved action.");
    return approved;
  }
  if (kind === "append_html") {
    const auto = client.onboarding?.auto?.websiteTech !== false;
    if (!auto && !approved) throw new WpError("This owner asked to approve website fixes. Create a work-log item for their OK first.");
    return approved || null;
  }
  throw new WpError("Unknown change type.");
}

/**
 * Applies one change to one page. Backs up first, verifies after.
 * @param {{pageId:number, kind:"append_html"|"replace_content", html:string, title?:string, actionId?:string, by:string}} input
 */
export async function applyChange(client, { pageId, kind, html, title, actionId, by }) {
  const body = String(html || "").trim();
  if (!body) throw new WpError("Nothing to apply.");
  if (body.length > 100_000) throw new WpError("That change is too large.");
  const linked = policyCheck(client, kind, await listActions(client.id), actionId);
  const conn = await loadConn(client.id);
  if (/<script/i.test(body) && !conn.unfilteredHtml) throw new WpError("This WordPress user can't save <script> tags (needed for JSON-LD schema), so WordPress would strip them. Use an administrator's application password.");

  const before = await wp(conn, `/wp/v2/pages/${Number(pageId)}?context=edit`);
  const id = Date.now().toString(36);
  const newContent = kind === "append_html"
    ? `${before.content?.raw || ""}\n\n${MARK(id)}\n${body}\n${MARK(`${id}-end`)}`
    : body;
  const backup = {
    id, at: new Date().toISOString(), by, kind, pageId: before.id, pageTitle: before.title?.raw || "", link: before.link,
    before: { title: before.title?.raw || "", content: before.content?.raw || "" },
    after: { title: title || null, contentLength: newContent.length }, actionId: linked?.id || null, undoneAt: null,
  };
  await set(backupKey(client.id), [backup, ...(await listBackups(client.id))].slice(0, 50));

  await wp(conn, `/wp/v2/pages/${before.id}`, { method: "POST", body: { content: newContent, ...(title ? { title } : {}) } });
  const after = await wp(conn, `/wp/v2/pages/${before.id}?context=edit`);
  const raw = after.content?.raw || "";
  const stuck = kind === "append_html" ? raw.includes(MARK(id)) && (!/<script/i.test(body) || /<script/i.test(raw.split(MARK(id))[1] || "")) : raw.trim() === newContent.trim();
  if (!stuck) {
    // Put the page back exactly as it was rather than leave a half-applied change.
    await wp(conn, `/wp/v2/pages/${before.id}`, { method: "POST", body: { content: backup.before.content, title: backup.before.title } });
    throw new WpError("WordPress didn't keep the change as sent (a plugin or permission may have filtered it). The page was restored.");
  }

  const actionIdDone = linked?.id || (await createAction(client.id, {
    type: kind === "append_html" ? "site_schema" : "site_page",
    title: `Updated website page: ${backup.pageTitle || before.id}`,
    detail: `Applied ${kind === "append_html" ? "an added block" : "new wording"} to ${before.link}. Backup ${id} can undo it.`,
  })).id;
  await updateAction(client.id, actionIdDone, { status: "done", proofUrl: before.link }).catch(() => {});
  const all = await listBackups(client.id);
  await set(backupKey(client.id), all.map((b) => (b.id === id ? { ...b, actionId: actionIdDone, verified: true } : b)));
  return { backupId: id, link: before.link, verified: true };
}

/** Restores a page to its state before the given change. */
export async function undoChange(client, backupId, by) {
  const all = await listBackups(client.id);
  const b = all.find((x) => x.id === backupId);
  if (!b) throw new WpError("Backup not found.");
  if (b.undoneAt) throw new WpError("That change was already undone.");
  const newer = all.find((x) => x.pageId === b.pageId && !x.undoneAt && x.at > b.at);
  if (newer) throw new WpError("A newer change to this page exists. Undo that one first.");
  const conn = await loadConn(client.id);
  await wp(conn, `/wp/v2/pages/${b.pageId}`, { method: "POST", body: { content: b.before.content, title: b.before.title } });
  const check = await wp(conn, `/wp/v2/pages/${b.pageId}?context=edit`);
  if ((check.content?.raw || "").trim() !== b.before.content.trim()) throw new WpError("WordPress didn't accept the restore. Restore the page from WordPress's own revisions.");
  await set(backupKey(client.id), all.map((x) => (x.id === backupId ? { ...x, undoneAt: new Date().toISOString(), undoneBy: by } : x)));
  if (b.actionId) await updateAction(client.id, b.actionId, { detail: `Undone ${new Date().toISOString().slice(0, 10)} by ${by}: page restored from backup ${b.id}.` }).catch(() => {});
  return { ok: true };
}
