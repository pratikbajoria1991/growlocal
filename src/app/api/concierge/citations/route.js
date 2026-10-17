import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin, getClient } from "@/lib/clients";
import { getCitations, updateCitation, checkListing } from "@/lib/citations";
import { listSnapshots } from "@/lib/tracking";
import { normalizeOnboarding } from "@/lib/onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function gate() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (!isAdmin(user)) return { error: NextResponse.json({ error: "Not authorised." }, { status: 403 }) };
  return { user };
}

// The exact details every listing must carry, so they all match Google.
// Google's live listing wins; the owner's onboarding form fills the rest.
async function submissionKit(client) {
  const nap = (await listSnapshots(client.id))[0]?.nap || {};
  const ob = client.onboarding ? normalizeOnboarding(client.onboarding) : null;
  return {
    name: nap.name || client.name || "",
    address: nap.address || "",
    phone: nap.phone || client.phone || "",
    website: nap.website || client.website || "",
    category: client.vertical || "",
    hours: ob?.hours || "",
    services: ob?.services.map((s) => s.name).join(", ") || client.services || "",
    areas: ob?.serviceAreas || "",
    description: ob?.highlights || "",
    source: nap.name ? "Google listing (latest tracking snapshot) + owner onboarding" : "Client record + owner onboarding (run tracking once to pull the live Google details)",
  };
}

export async function GET(req) {
  const { error } = await gate();
  if (error) return error;
  const client = await getClient(new URL(req.url).searchParams.get("clientId"));
  if (!client) return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  return NextResponse.json({ ...(await getCitations(client)), kit: await submissionKit(client) });
}

// POST { clientId, directoryId, status?, listingUrl?, note? }           -> update
// POST { clientId, directoryId, check: true }                          -> check the live listing
export async function POST(req) {
  const { error } = await gate();
  if (error) return error;
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const client = await getClient(body?.clientId);
  if (!client) return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  if (!body.directoryId) return NextResponse.json({ error: "Which directory?" }, { status: 400 });

  try {
    if (body.check) {
      const { state } = await getCitations(client);
      const url = state[body.directoryId]?.listingUrl;
      if (!url) return NextResponse.json({ error: "Add the listing URL first." }, { status: 400 });
      const kit = await submissionKit(client);
      const check = await checkListing(url, kit);
      // A failed details check moves a live listing to "details wrong"; it never auto-marks anything live.
      const status = check.ok === false && check.nameOk !== undefined && state[body.directoryId]?.status === "live" && check.phoneOk === false ? "needs_fix" : undefined;
      return NextResponse.json({ ...(await updateCitation(client, body.directoryId, { status, check, note: status ? check.reason : undefined })), check });
    }
    return NextResponse.json(await updateCitation(client, body.directoryId, { status: body.status, listingUrl: body.listingUrl, note: body.note }));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
