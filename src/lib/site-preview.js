// Preview websites for businesses that don't have one.
//
// Built from a business's live Google listing and shared with the owner in
// outreach: "here's the site you could have". Because it carries a real
// business's name before they've agreed to anything, three rules are
// enforced here, not left to the page:
//   1. Facts only. Every sentence comes from the listing (name, category,
//      address, phone, hours, rating, Google's own summary, accessibility and
//      payment flags). No invented services, testimonials or photos — Google's
//      terms don't allow reusing listing photos either.
//   2. Clearly a preview. The page says so, can't be indexed, and links to
//      claim or remove it.
//   3. It expires. Unclaimed previews stop resolving after 30 days.

import crypto from "crypto";
import { get, set } from "./store";
import { placesBatch, placesProvider } from "./places";

const TTL_DAYS = 30;
const INDEX = "previews:index";
const key = (slug) => `preview:${slug}`;

export const PREVIEW_FIELDS = [
  "id", "displayName", "primaryType", "primaryTypeDisplayName", "types", "formattedAddress",
  "addressComponents", "location", "nationalPhoneNumber", "internationalPhoneNumber", "websiteUri",
  "regularOpeningHours", "rating", "userRatingCount", "googleMapsUri", "businessStatus",
  "editorialSummary", "accessibilityOptions", "paymentOptions", "parkingOptions",
];

export class PreviewError extends Error {
  constructor(message, { code } = {}) { super(message); this.code = code; }
}

// Visual + wording theme by kind of business. Wording is structural
// ("Book a visit", "Call us") — never a claim about quality or services.
const THEMES = {
  health: {
    types: ["dentist", "dental_clinic", "doctor", "medical_clinic", "skin_care_clinic", "physiotherapist", "hospital", "medical_lab", "optometrist", "chiropractor", "veterinary_care"],
    accent: "#0f766e", soft: "#e6f4f1", cta: "Book an appointment", noun: "clinic",
  },
  professional: {
    types: ["lawyer", "accounting", "consultant", "real_estate_agency", "insurance_agency", "finance", "travel_agency"],
    accent: "#1e3a8a", soft: "#e8edf8", cta: "Book a consultation", noun: "office",
  },
  beauty: {
    types: ["beauty_salon", "hair_salon", "spa", "nail_salon", "barber_shop", "hair_care", "gym", "fitness_center", "yoga_studio"],
    accent: "#9d174d", soft: "#fbeaf2", cta: "Book a visit", noun: "studio",
  },
  design: {
    types: ["interior_designer", "architect", "general_contractor", "furniture_store", "home_goods_store"],
    accent: "#7c4a1e", soft: "#f6eee6", cta: "Start your project", noun: "studio",
  },
  education: {
    types: ["school", "preschool", "educational_institution", "tutoring", "driving_school"],
    accent: "#5b21b6", soft: "#efe9fb", cta: "Enquire about admission", noun: "centre",
  },
  default: { types: [], accent: "#1f2937", soft: "#eef0f3", cta: "Get in touch", noun: "place" },
};

export function themeFor(types = []) {
  for (const [id, t] of Object.entries(THEMES)) {
    if (id !== "default" && types.some((x) => t.types.includes(x))) return { id, ...t };
  }
  return { id: "default", ...THEMES.default };
}

function addressPart(place, ...wanted) {
  for (const type of wanted) {
    const c = (place.addressComponents || []).find((x) => (x.types || []).includes(type));
    if (c) return c.longText || c.shortText || null;
  }
  return null;
}

// Google business names are often keyword-stuffed ("Dr X | Best Dentist in
// Kolkata"). The site uses the real name — the part before the stuffing.
const cleanName = (n) => String(n || "").split(/\s[|:–]\s|\s-\s|\|/)[0].trim();

const slugify = (s) => cleanName(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

function normalize(place) {
  const name = cleanName(place.displayName?.text) || "This business";
  const types = [place.primaryType, ...(place.types || [])].filter(Boolean);
  const theme = themeFor(types);
  const phone = place.nationalPhoneNumber || null;
  const intl = place.internationalPhoneNumber ? place.internationalPhoneNumber.replace(/[^\d+]/g, "") : null;
  const mobileDigits = intl ? intl.replace(/\D/g, "").slice(-10) : "";

  // Only flags Google marks true become statements on the page.
  const facts = [];
  const a = place.accessibilityOptions || {};
  if (a.wheelchairAccessibleEntrance) facts.push("Wheelchair-accessible entrance");
  if (a.wheelchairAccessibleParking) facts.push("Wheelchair-accessible parking");
  const p = place.paymentOptions || {};
  if (p.acceptsCreditCards) facts.push("Accepts credit cards");
  if (p.acceptsDebitCards) facts.push("Accepts debit cards");
  if (p.acceptsNfc) facts.push("Accepts contactless payments");
  const pk = place.parkingOptions || {};
  if (pk.freeParkingLot || pk.freeStreetParking) facts.push("Free parking nearby");

  return {
    placeId: place.id,
    name,
    listingName: place.displayName?.text || name,
    category: place.primaryTypeDisplayName?.text || null,
    primaryType: place.primaryType || null,
    theme: theme.id,
    address: place.formattedAddress || null,
    area: addressPart(place, "sublocality_level_1", "neighborhood", "sublocality"),
    city: addressPart(place, "locality") || "Kolkata",
    postalCode: addressPart(place, "postal_code"),
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    phone,
    phoneHref: intl,
    // wa.me only for Indian mobile numbers — landlines can't receive WhatsApp.
    whatsapp: /^[6-9]\d{9}$/.test(mobileDigits) ? `91${mobileDigits}` : null,
    hours: place.regularOpeningHours?.weekdayDescriptions || [],
    periods: place.regularOpeningHours?.periods || [],
    rating: place.rating ?? null,
    reviews: place.userRatingCount ?? 0,
    mapsUri: place.googleMapsUri ? place.googleMapsUri.split("&g_mp")[0] : null,
    summary: place.editorialSummary?.text || null,
    facts,
  };
}

/**
 * Builds and stores a preview for one place. Refuses businesses that already
 * have a website (unless forced) or aren't operating.
 */
export async function createPreview(placeId, { force = false } = {}) {
  if (!placesProvider()) throw new PreviewError("No Google Maps data source configured.", { code: "not_configured" });
  if (!/^[A-Za-z0-9_-]{10,}$/.test(String(placeId || ""))) throw new PreviewError("That doesn't look like a Google place ID.", { code: "bad_id" });

  const [place] = await placesBatch([{ kind: "details", id: placeId, fields: PREVIEW_FIELDS }]);
  if (place instanceof Error) throw new PreviewError(place.message, { code: place.code });
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") {
    throw new PreviewError("Google doesn't show this business as operating.", { code: "not_operational" });
  }
  if (place.websiteUri && !force) {
    throw new PreviewError(`This business already links a website (${place.websiteUri}).`, { code: "has_website" });
  }

  // Reuse an existing live preview for the same place rather than minting a second URL.
  const index = (await get(INDEX)) || [];
  const existing = index.find((x) => x.placeId === placeId && new Date(x.expiresAt) > new Date());
  const slug = existing?.slug || `${slugify(place.displayName?.text) || "business"}-${crypto.randomBytes(3).toString("hex")}`;

  const now = new Date();
  const preview = {
    slug,
    ...normalize(place),
    createdAt: existing?.createdAt || now.toISOString(),
    refreshedAt: now.toISOString(),
    expiresAt: existing?.expiresAt || new Date(now.getTime() + TTL_DAYS * 86_400_000).toISOString(),
  };

  await set(key(slug), preview);
  const entry = { slug, placeId, name: preview.name, createdAt: preview.createdAt, expiresAt: preview.expiresAt };
  await set(INDEX, [entry, ...index.filter((x) => x.slug !== slug)].slice(0, 2000));
  return preview;
}

export async function getPreview(slug) {
  if (!/^[a-z0-9-]{3,60}$/.test(String(slug || ""))) return null;
  const p = await get(key(slug));
  if (!p || new Date(p.expiresAt) < new Date()) return null;
  return p;
}

export async function listPreviews() {
  return (await get(INDEX)) || [];
}

export async function deletePreview(slug) {
  await set(key(slug), null);
  const index = (await get(INDEX)) || [];
  await set(INDEX, index.filter((x) => x.slug !== slug));
  return true;
}
