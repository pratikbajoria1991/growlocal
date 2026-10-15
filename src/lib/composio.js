// Composio client — Google Maps data without a Google Cloud project.
//
// COMPOSIO_API_KEY here is a Composio *consumer* key (ck_…). Consumer keys do
// not authenticate Composio's REST API; they authenticate its MCP endpoint.
// So this speaks MCP (JSON-RPC over streamable HTTP) directly: initialize a
// session, then call COMPOSIO_MULTI_EXECUTE_TOOL, which runs several Google
// Maps tools in one round trip. The Google Maps toolkit must be connected in
// the Composio account that owns the key.

const MCP_URL = process.env.COMPOSIO_MCP_URL || "https://connect.composio.dev/mcp";
const TIMEOUT_MS = 45_000;
const SESSION_TTL_MS = 10 * 60 * 1000;

export class ComposioError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.code = code;
  }
}

export const composioConfigured = () => Boolean(process.env.COMPOSIO_API_KEY);

// Serverless instances are reused between requests; a session saves two
// round trips per call while it lives.
let session = null;
let nextId = 1;

function parseRpc(text, id) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    const msg = JSON.parse(trimmed);
    if (msg.id === id) return msg;
  }
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    try {
      const msg = JSON.parse(line.slice(5).trim());
      if (msg.id === id) return msg;
    } catch { /* keep-alive or partial line */ }
  }
  throw new ComposioError("Unexpected response from Composio.", { code: "parse" });
}

async function post(body, sessionId) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(MCP_URL, {
      method: "POST",
      signal: ctrl.signal,
      cache: "no-store",
      headers: {
        "x-consumer-api-key": process.env.COMPOSIO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401 || res.status === 403) {
      throw new ComposioError("Composio rejected the API key.", { code: "bad_key" });
    }
    if ((res.status === 404 || res.status === 400) && sessionId) {
      throw new ComposioError("Composio session expired.", { code: "session" });
    }
    if (!res.ok) throw new ComposioError(`Composio returned HTTP ${res.status}.`, { code: "upstream" });

    const sid = res.headers.get("mcp-session-id");
    // Notifications have no id and no meaningful body.
    if (body.id === undefined) return { sid, msg: null };
    return { sid, msg: parseRpc(await res.text(), body.id) };
  } catch (e) {
    if (e.name === "AbortError") throw new ComposioError("Composio took too long to respond.", { code: "timeout" });
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function openSession() {
  const { sid, msg } = await post({
    jsonrpc: "2.0",
    id: nextId++,
    method: "initialize",
    params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "growlocal", version: "1.0" } },
  });
  if (msg?.error) throw new ComposioError(`Composio refused the session: ${msg.error.message}`, { code: "upstream" });
  await post({ jsonrpc: "2.0", method: "notifications/initialized" }, sid);
  session = { id: sid, at: Date.now() };
  return session;
}

async function callMultiExecute(calls) {
  if (!session || Date.now() - session.at > SESSION_TTL_MS) await openSession();
  const id = nextId++;
  const { msg } = await post({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: {
      name: "COMPOSIO_MULTI_EXECUTE_TOOL",
      arguments: {
        tools: calls.map((c) => ({ tool_slug: c.slug, arguments: c.args })),
        sync_response_to_workbench: false,
      },
    },
  }, session.id);
  return msg;
}

/**
 * Runs Composio tools in one round trip.
 * @param {{slug: string, args: object}[]} calls
 * @returns {Promise<Array<object|ComposioError>>} each tool's data, in order —
 *   a failed tool comes back as a ComposioError in its slot rather than
 *   failing the whole batch.
 */
export async function executeTools(calls) {
  if (!composioConfigured()) throw new ComposioError("COMPOSIO_API_KEY is not set.", { code: "not_configured" });

  let msg;
  try {
    msg = await callMultiExecute(calls);
  } catch (e) {
    if (e.code !== "session") throw e;
    session = null;
    msg = await callMultiExecute(calls);
  }

  if (msg.error) throw new ComposioError(`Composio error: ${msg.error.message}`, { code: "upstream" });
  const text = msg.result?.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new ComposioError("Composio returned an empty result.", { code: "parse" });

  let payload;
  try { payload = JSON.parse(text); } catch {
    throw new ComposioError(msg.result?.isError ? text.slice(0, 200) : "Composio returned unreadable data.", { code: "parse" });
  }

  const results = payload?.data?.results;
  if (!Array.isArray(results)) {
    throw new ComposioError(payload?.error ? `Composio error: ${String(payload.error).slice(0, 200)}` : "Composio returned no results.", { code: "upstream" });
  }

  const out = new Array(calls.length).fill(null).map(() => new ComposioError("Tool did not run.", { code: "missing" }));
  for (const r of results) {
    const i = Number.isInteger(r.index) ? r.index : results.indexOf(r);
    const response = r.response || {};
    if (response.successful === false || response.error) {
      out[i] = new ComposioError(String(response.error || "Tool failed.").slice(0, 300), { code: "tool_failed" });
    } else if (response.data !== undefined) {
      out[i] = response.data;
    } else if (response.data_preview !== undefined) {
      // Composio moved a large result to its sandbox and only sent a preview.
      // A preview is incomplete data — never score from it.
      out[i] = new ComposioError("Result too large to return inline.", { code: "truncated" });
    }
  }
  return out;
}
