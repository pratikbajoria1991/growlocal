// Growlocal brand + product config. Single source of truth.

export const BRAND = {
  name: "Growlocal",
  tagline: "Get found on Google, Maps, and AI.",
  pitch:
    "Growlocal audits your website for SEO, AEO and GEO — then runs your Google Business Profile on autopilot with an AI agent.",
  // One-sentence definition, written to be lifted verbatim by an answer engine.
  // Used on-page. Too long for a meta description — see metaDescription below.
  definition:
    "Growlocal is a free website audit tool that scores any page out of 100 on SEO, Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO), then tells you exactly how to fix each gap.",
  // 50-160 chars, per the rule our own SEO audit enforces.
  metaDescription:
    "Free website audit scoring your page out of 100 on SEO, AEO and GEO — with the exact fix for every gap. No signup.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://growlocal.vercel.app",
  email: "hello@growlocal.app",
  supportEmail: "support@growlocal.app",
  country: "India",
};

// Real, verifiable business details. These power our own LocalBusiness schema —
// the same fields the GEO audit checks for on customer sites.
export const ORG = {
  founder: "Pratik Bajoria",
  telephone: "+91-98765-43210",
  telHref: "+919876543210",
  streetAddress: "Ballygunge Circular Road",
  addressLocality: "Kolkata",
  addressRegion: "West Bengal",
  postalCode: "700019",
  latitude: 22.5405,
  longitude: 88.3648,
  opens: "10:00",
  closes: "19:00",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=22.5405,88.3648",
  areaServed: ["India", "Kolkata", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune"],
  sameAs: [
    "https://github.com/pratikbajoria1991/growlocal",
    "https://www.linkedin.com/in/pratikbajoria",
  ],
};

// The two products. Everything on the site maps to one of these.
export const PRODUCTS = [
  {
    id: "audit",
    name: "Visibility Audit",
    href: "/audit",
    headline: "Score any website for SEO, AEO and GEO",
    blurb:
      "Paste a URL. We fetch the page, parse the HTML, and grade it across the three surfaces that decide whether customers can find you — traditional search, AI answer engines, and local/generative search.",
    bullets: [
      "Three separate scores out of 100",
      "Every finding shows exactly how to fix it",
      "Runs in under 5 seconds, no signup",
    ],
    cta: "Run a free audit",
  },
  {
    id: "autopilot",
    name: "GBP Autopilot",
    href: "/autopilot",
    headline: "Put your Google Business Profile on autopilot",
    blurb:
      "Connect your Google Business Profile once. An AI agent drafts your weekly posts, replies to every review, builds your FAQ, and ships a monthly performance report. You approve, it publishes.",
    bullets: [
      "Weekly GBP posts drafted automatically",
      "Every review answered within 48 hours",
      "Monthly report with specific next actions",
    ],
    cta: "Join the waitlist",
  },
];

export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    cadence: "forever",
    tagline: "Audit any website, as often as you like.",
    features: [
      "Unlimited SEO / AEO / GEO audits",
      "Full findings with fix instructions",
      "No signup required",
    ],
    cta: "Run an audit",
    href: "/audit",
  },
  {
    id: "autopilot",
    name: "Autopilot",
    price: "₹4,999",
    priceNumeric: 4999,
    cadence: "per month",
    tagline: "One Google Business Profile, fully managed by AI.",
    features: [
      "Everything in Free",
      "1 Google Business Profile connected",
      "8 GBP posts drafted per month",
      "Unlimited AI review replies",
      "FAQ + schema generation",
      "Monthly performance report",
      "Email support",
    ],
    cta: "Join the waitlist",
    href: "/autopilot",
    featured: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: "₹14,999",
    priceNumeric: 14999,
    cadence: "per month",
    tagline: "Up to 10 profiles. Built for multi-location and agencies.",
    features: [
      "Everything in Autopilot",
      "Up to 10 Google Business Profiles",
      "Bulk audit + export (CSV)",
      "White-label audit reports",
      "Competitor tracking",
      "Priority support",
    ],
    cta: "Talk to us",
    href: "/contact",
  },
];

export const AUDIT_CATEGORIES = {
  SEO: {
    tag: "SEO",
    name: "Search Engine Optimization",
    short: "Classic Google ranking signals",
    description:
      "Title tags, meta descriptions, heading structure, canonical URLs, mobile viewport, image alt text, HTTPS, and structured data. The foundation everything else sits on.",
    color: "#38bdf8",
  },
  AEO: {
    tag: "AEO",
    name: "Answer Engine Optimization",
    short: "Getting cited by ChatGPT, Perplexity, AI Overviews",
    description:
      "FAQ schema, question-format headings, concise extractable answers, author metadata, and HowTo markup. This is what decides whether an AI names your business in its answer.",
    color: "#7ee23e",
  },
  GEO: {
    tag: "GEO",
    name: "Generative & Geographic Optimization",
    short: "Local intent and 'near me' visibility",
    description:
      "LocalBusiness schema, geo coordinates, areaServed, opening hours, tap-to-call links, and location signals in your copy. What makes you show up for 'near me' searches.",
    color: "#f59e0b",
  },
};

// Written as questions people actually type, with answers short enough for an
// answer engine to lift whole. These render on the page AND as FAQPage schema.
export const HOME_FAQ = [
  {
    q: "What is Growlocal?",
    a: "Growlocal is a free website audit tool that scores any page out of 100 on SEO, Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO), then tells you exactly how to fix each gap. It also offers GBP Autopilot, an AI agent that manages your Google Business Profile.",
  },
  {
    q: "How do I check if my website is visible to AI search?",
    a: "Paste your URL into Growlocal's free audit. It checks the specific signals AI answer engines rely on — FAQPage schema, question-format headings, direct answer patterns, author metadata and extractable paragraph length — and returns an AEO score out of 100 with a fix for every gap.",
  },
  {
    q: "Is the Growlocal audit really free?",
    a: "Yes. The audit is free with no signup, no card and no usage limit. You only pay if you want GBP Autopilot, where an AI agent drafts your Google Business Profile posts and review replies for ₹4,999 per month.",
  },
  {
    q: "What is the difference between SEO, AEO and GEO?",
    a: "SEO optimises for a ranking position on Google's results page. AEO (Answer Engine Optimization) optimises to be the source an AI quotes inside a generated answer. GEO (Generative and Geographic Optimization) covers both generative-AI visibility and local signals like LocalBusiness schema that decide whether you appear for 'near me' searches.",
  },
  {
    q: "How long does an audit take?",
    a: "Under five seconds for most sites. Growlocal fetches the page, parses the HTML and runs roughly 30 weighted checks. If a site blocks automated requests, it retries through a reader proxy automatically.",
  },
  {
    q: "Do I need to install anything on my website?",
    a: "No. Growlocal reads your page's public HTML the same way Google does. There is no script to embed, no plugin to install and no access to grant.",
  },
  {
    q: "Which businesses benefit most from AEO and GEO?",
    a: "Local businesses where customers search before buying — clinics, dentists, restaurants, hotels, salons, gyms, diagnostic labs, real-estate agents and professional services. These are the queries AI assistants answer by naming two or three specific businesses.",
  },
  {
    q: "Can Growlocal fix the issues it finds?",
    a: "The audit gives you copy-and-paste instructions for every finding, so you or your developer can fix them directly. GBP Autopilot goes further for Google Business Profile work, drafting posts, review replies and FAQ schema for your approval.",
  },
];

// Ordered steps, also emitted as HowTo schema.
export const HOW_IT_WORKS = [
  { name: "Paste your website URL", text: "Enter any page address on the free audit. No account, no card, no script to install." },
  { name: "Growlocal fetches and parses the page", text: "It reads your public HTML exactly as a search crawler does, extracting schema, headings, meta tags and local signals." },
  { name: "Read your three scores", text: "You get SEO, AEO and GEO scored out of 100 each, with every passing and failing check listed." },
  { name: "Apply the ranked fixes", text: "The five highest-impact fixes are ranked by points recoverable, each with specific instructions you can hand to a developer." },
];

export const NAV = [
  { href: "/audit", label: "Free audit" },
  { href: "/tools", label: "Tools" },
  { href: "/autopilot", label: "GBP Autopilot" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

export const FOOTER_NAV = {
  Product: [
    { href: "/audit", label: "Visibility audit" },
    { href: "/tools", label: "Free tools" },
    { href: "/autopilot", label: "GBP Autopilot" },
    { href: "/pricing", label: "Pricing" },
  ],
  Learn: [
    { href: "/blog", label: "Blog" },
    { href: "/what-is-aeo", label: "What is AEO?" },
    { href: "/what-is-geo", label: "What is GEO?" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
};
