export const TOOLS = [
  {
    slug: "ai-visibility",
    name: "AI Visibility",
    tagline: "Can AI crawlers actually see your site?",
    description:
      "Reads your robots.txt and checks whether GPTBot, ClaudeBot, PerplexityBot, Google-Extended and the rest are allowed through. Blocking them removes you from the corpora that decide who gets cited.",
    icon: "Eye",
    color: "#7ee23e",
    free: true,
  },
  {
    slug: "schema-generator",
    name: "Schema Generator",
    tagline: "Generate the JSON-LD you're missing",
    description:
      "Fill in your business details and get valid LocalBusiness, FAQPage and Organization markup, ready to paste into your <head>. No account, nothing sent to a server.",
    icon: "Package",
    color: "#38bdf8",
    free: true,
  },
  {
    slug: "compare",
    name: "Competitor Compare",
    tagline: "Score yourself against a rival, side by side",
    description:
      "Audits two sites at once and shows exactly which checks your competitor passes that you don't — ranked by the points you'd recover from closing each gap.",
    icon: "Scale",
    color: "#f59e0b",
    free: true,
  },
];

export function getTool(slug) {
  return TOOLS.find((t) => t.slug === slug) || null;
}

// Schema.org types that matter for local business, grouped for a sane dropdown.
export const BUSINESS_TYPES = [
  { group: "Healthcare", types: ["Dentist", "MedicalClinic", "Physician", "Optician", "Pharmacy", "VeterinaryCare", "PhysicalTherapy"] },
  { group: "Food & drink", types: ["Restaurant", "CafeOrCoffeeShop", "Bakery", "BarOrPub", "FastFoodRestaurant", "IceCreamShop"] },
  { group: "Lodging", types: ["Hotel", "BedAndBreakfast", "Resort", "Motel"] },
  { group: "Beauty & fitness", types: ["BeautySalon", "HairSalon", "DaySpa", "ExerciseGym", "NailSalon", "HealthClub"] },
  { group: "Professional", types: ["AccountingService", "LegalService", "RealEstateAgent", "InsuranceAgency", "FinancialService", "ProfessionalService"] },
  { group: "Retail & trade", types: ["Store", "ClothingStore", "ElectronicsStore", "FurnitureStore", "HardwareStore", "JewelryStore"] },
  { group: "Auto", types: ["AutoRepair", "AutoDealer", "AutoBodyShop", "GasStation"] },
  { group: "Education", types: ["EducationalOrganization", "School", "Preschool"] },
  { group: "Other", types: ["LocalBusiness", "HomeAndConstructionBusiness", "Plumber", "Electrician", "MovingCompany", "ChildCare"] },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function buildLocalBusinessSchema(f) {
  const s = {
    "@context": "https://schema.org",
    "@type": f.type || "LocalBusiness",
    name: f.name || undefined,
    description: f.description || undefined,
    url: f.url || undefined,
    telephone: f.telephone || undefined,
    email: f.email || undefined,
    priceRange: f.priceRange || undefined,
  };

  if (f.street || f.locality) {
    s.address = {
      "@type": "PostalAddress",
      streetAddress: f.street || undefined,
      addressLocality: f.locality || undefined,
      addressRegion: f.region || undefined,
      postalCode: f.postalCode || undefined,
      addressCountry: f.country || "IN",
    };
  }

  if (f.latitude && f.longitude) {
    s.geo = { "@type": "GeoCoordinates", latitude: Number(f.latitude), longitude: Number(f.longitude) };
  }

  const openDays = DAYS.filter((d) => f.days?.[d]);
  if (openDays.length && f.opens && f.closes) {
    s.openingHoursSpecification = [
      { "@type": "OpeningHoursSpecification", dayOfWeek: openDays, opens: f.opens, closes: f.closes },
    ];
  }

  const areas = (f.areaServed || "").split(",").map((a) => a.trim()).filter(Boolean);
  if (areas.length) s.areaServed = areas.map((name) => ({ "@type": "City", name }));

  const sameAs = (f.sameAs || "").split(/[\n,]/).map((a) => a.trim()).filter(Boolean);
  if (sameAs.length) s.sameAs = sameAs;

  if (f.image) s.image = f.image;

  return JSON.parse(JSON.stringify(s)); // drop undefined keys
}

export function buildFaqSchema(pairs) {
  const valid = pairs.filter((p) => p.q.trim() && p.a.trim());
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: valid.map((p) => ({
      "@type": "Question",
      name: p.q.trim(),
      acceptedAnswer: { "@type": "Answer", text: p.a.trim() },
    })),
  };
}
