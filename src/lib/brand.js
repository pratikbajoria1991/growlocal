// Growlocal brand + product config. Single source of truth.

export const BRAND = {
  name: "Growlocal",
  tagline: "Get found on Google, Maps, and AI.",
  pitch:
    "Growlocal audits your website for SEO, AEO and GEO — then runs your Google Business Profile on autopilot with an AI agent.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://growlocal.vercel.app",
  email: "hello@growlocal.app",
  supportEmail: "support@growlocal.app",
  country: "India",
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

export const NAV = [
  { href: "/audit", label: "Free audit" },
  { href: "/autopilot", label: "GBP Autopilot" },
  { href: "/pricing", label: "Pricing" },
];

export const FOOTER_NAV = {
  Product: [
    { href: "/audit", label: "Visibility audit" },
    { href: "/autopilot", label: "GBP Autopilot" },
    { href: "/pricing", label: "Pricing" },
  ],
  Learn: [
    { href: "/what-is-aeo", label: "What is AEO?" },
    { href: "/what-is-geo", label: "What is GEO?" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
};
