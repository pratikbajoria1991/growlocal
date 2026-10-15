// Drives a staged crew job forward from a route handler. After the response
// is sent, the current request runs one stage, then calls the crew route
// again (server-held API token) for the next, so every stage gets its own
// request and time limit. Without a token configured, the remaining stages
// run back to back in this request.

import { after } from "next/server";
import { advanceCrew } from "./crew";

export function chainNext(req, id) {
  const token = process.env.CONCIERGE_API_TOKEN;
  if (!token || token.length < 32) {
    after(async () => {
      let job = await advanceCrew(id);
      while (job.status === "running") job = await advanceCrew(id);
    });
    return;
  }
  const origin = new URL(req.url).origin;
  after(async () => {
    const job = await advanceCrew(id);
    if (job.status !== "running") return;
    await fetch(`${origin}/api/concierge/crew`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ advance: id }),
    }).catch((e) => console.error("[crew] chain failed", id, e.message));
  });
}
