export const TOOLS = [
  {
    slug: "site-audit",
    name: "Site Audit",
    tagline: "Crawl your site for SEO problems",
    description:
      "Crawls up to 25 pages and finds broken links, errors, missing or duplicate titles, thin content, heading problems and redirect chains, sorted by impact.",
    icon: "ScanSearch",
    color: "#e11d48",
    group: "Website",
    free: true,
  },
  {
    slug: "keyword-ideas",
    name: "Keyword Research",
    tagline: "What do people actually search?",
    description:
      "Hundreds of real Google searches for your service and area, grouped into local searches, questions and ready-to-buy searches.",
    icon: "Search",
    color: "#0ea5e9",
    group: "Search",
    free: true,
  },
  {
    slug: "maps-rank",
    name: "Google Maps Rank Checker",
    tagline: "Where do you rank on Maps?",
    description:
      "Your position in the top 20 on Google Maps for any search and area, with the ratings and reviews of the businesses above you.",
    icon: "MapPin",
    color: "#16a34a",
    group: "Search",
    free: true,
  },
  {
    slug: "ai-answer",
    name: "AI Answer Check",
    tagline: "Does AI recommend you?",
    description:
      "Asks Google's Gemini the question your customers ask, shows whether you're named, and lists the websites the answer came from.",
    icon: "Sparkles",
    color: "#a855f7",
    group: "AI",
    free: true,
  },
  {
    slug: "page-speed",
    name: "Page Speed Test",
    tagline: "How fast does your page load?",
    description:
      "Google's PageSpeed test with Core Web Vitals from real visitors where available, and the fixes that save the most time.",
    icon: "Gauge",
    color: "#f97316",
    group: "Website",
    free: true,
  },
  {
    slug: "backlink-finder",
    name: "Backlink & Citation Finder",
    tagline: "Which profiles should link to you?",
    description:
      "Checks which directories and business profiles your site links to, compares a competitor, and finds sites that already mention you so you can ask for a link.",
    icon: "Link2",
    color: "#16a34a",
    group: "Links",
    free: true,
  },
  {
    slug: "ai-visibility",
    name: "AI Crawler Check",
    tagline: "Can AI crawlers actually see your site?",
    description:
      "Reads your robots.txt and checks whether GPTBot, ClaudeBot, PerplexityBot, Google-Extended and the rest are allowed through. Blocking them removes you from the corpora that decide who gets cited.",
    icon: "Eye",
    color: "#65a30d",
    group: "AI",
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
    group: "Website",
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
    group: "Search",
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
