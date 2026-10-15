// Growlocal brand + product config. Single source of truth.
//
// Positioning: Growlocal replaces the need to hire a local marketing agency.
// The customer is the business owner, never an agency. We sell the outcome —
// "your local presence is handled" — not software the owner has to operate.

export const BRAND = {
  name: "Growlocal",
  tagline: "Your local marketing, handled.",
  pitch:
    "Growlocal is a done-for-you local marketing service. We run your Google Business Profile, review replies, website SEO and AI search visibility every week — so you don't need to hire an agency.",
  // One-sentence definition, written to be lifted verbatim by an answer engine.
  // Used on-page. Too long for a meta description — see metaDescription below.
  definition:
    "Growlocal is a done-for-you local marketing service for business owners: we run your Google Business Profile, review replies, website SEO and AI search visibility every week, and report results from your real Google numbers — no agency, no dashboard to learn.",
  // 50-160 chars, per the rule our own SEO audit enforces.
  metaDescription:
    "Done-for-you local marketing: we run your Google profile, reviews, website SEO and AI visibility. No agency needed. Start with a free audit.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://growlocal.vercel.app",
  email: "hello@growlocal.app",
  supportEmail: "support@growlocal.app",
  country: "India",
};

// Business details that power our own Organization schema.
export const ORG = {
  founder: "Pratik Bajoria",
  // No public phone or street address is published until real ones are added.
  areaServed: ["India", "Kolkata", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune"],
  sameAs: [
    "https://github.com/pratikbajoria1991/growlocal",
    "https://www.linkedin.com/in/pratikbajoria",
  ],
};

// What the service does, split by who has to act. This is the service
// contract in plain language — it renders on /managed and backs the ledger's
// risk tiers in src/lib/ledger-types.js. Keep the two in step.
export const AUTONOMY = {
  weDo: [
    "Weekly posts on your Google Business Profile",
    "Replies to positive reviews",
    "Services, products and attributes on your profile",
    "FAQ and schema markup on your website",
    "Directory listings, kept consistent with your profile",
  ],
  youApprove: [
    "Business name, category, address, hours or description",
    "Replies to negative or health-related reviews",
    "New or rewritten pages and articles on your website",
  ],
  weNever: [
    "Buy, write or ask for fake reviews",
    "Promise a ranking, lead count or revenue number",
    "Ask for your Google password",
    "Use tactics that break Google's guidelines",
  ],
};

// The products. Everything on the site maps to one of these.
//
// `status` is load-bearing, not decoration. Every claim in `bullets` must be
// something we actually deliver today. Anything we intend to build goes in
// `planned` and renders as "planned", never as a feature.
export const PRODUCTS = [
  {
    id: "audit",
    name: "Free visibility audit",
    href: "/audit",
    status: "live",
    headline: "See what's costing you customers",
    blurb:
      "Paste your website. In seconds you see how visible you are on Google, on Maps, and in AI answers like ChatGPT — and what's missing.",
    bullets: [
      "Scores for SEO, AEO and GEO out of 100",
      "Every gap explained in plain language",
      "Free, no signup",
    ],
    cta: "Run a free audit",
  },
  {
    id: "managed",
    name: "Growlocal Managed",
    href: "/managed",
    status: "founding",
    statusNote: "Taking founding clients — limited slots",
    headline: "We do the work an agency would. You run your business.",
    blurb:
      "Every week we update your Google profile, reply to reviews and fix your website for Google and AI search. You approve only the changes that matter, on WhatsApp, and get a monthly report from your real Google numbers.",
    bullets: [
      "Weekly Google Business Profile posts and updates",
      "Review replies — sensitive ones only with your OK",
      "FAQ and schema added to your website",
      "Monthly report: calls, directions, website clicks, profile views",
    ],
    planned: [
      "Instant publishing through Google's API (awaiting Google's approval of our app)",
      "Map ranking tracked across your neighbourhood",
    ],
    cta: "Apply for a founding slot",
  },
];

// Proposals quote a tier from how many issues the proposal found — more to
// fix, more work every week. Thresholds and prices are business decisions;
// change them here and every proposal, page and schema follows.
export const PROPOSAL_TIERS = [
  {
    id: "essentials",
    name: "Essentials",
    maxIssues: 6,
    price: "₹4,999",
    priceNumeric: 4999,
    pitch: "Your presence is mostly in shape. We close the remaining gaps and keep everything current every week.",
  },
  {
    id: "growth",
    name: "Growth",
    maxIssues: Infinity,
    price: "₹9,999",
    priceNumeric: 9999,
    pitch: "You have real ground to make up on nearby competitors. We work through the gaps in priority order, every week.",
  },
];

export const PLANS = [
  {
    id: "free",
    name: "Free audit",
    price: "₹0",
    cadence: "forever",
    status: "live",
    tagline: "Find out what's costing you customers. As often as you like.",
    features: [
      "Unlimited SEO / AEO / GEO audits",
      "Google Business Profile score from your Maps link",
      "Every gap explained, no signup",
    ],
    cta: "Run an audit",
    href: "/audit",
  },
  {
    id: "managed",
    name: "Managed",
    price: "From ₹4,999",
    priceNumeric: 4999,
    cadence: "per location / month",
    status: "founding",
    tagline: "Your local marketing, done for you every week. Essentials ₹4,999 or Growth ₹9,999 — your free proposal shows which fits, based on how much there is to fix.",
    features: [
      "8 Google Business Profile posts a month",
      "Replies to every new review",
      "Services, attributes and photos kept current",
      "FAQ + schema added to your website",
      "Directory listings built and kept consistent",
      "Monthly results report from your Google numbers",
      "Approvals and updates on WhatsApp",
    ],
    planned: [
      "Instant publishing via Google's API",
      "Neighbourhood map-rank tracking",
    ],
    cta: "Get my free proposal",
    href: "/proposal",
    featured: true,
  },
  {
    id: "multi",
    name: "Multi-location",
    price: "Custom",
    cadence: "per location",
    status: "talk",
    tagline: "Clinics, salons and restaurants with several branches — one owner, every location handled.",
    features: [
      "Everything in Managed, for each location",
      "One monthly report across all branches",
      "One WhatsApp thread for approvals",
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
  // Scored separately, from a Google Maps link rather than a website — the
  // three categories above judge what your site says about your business;
  // this judges the live Google Business Profile a customer actually sees.
  GBP: {
    tag: "GBP",
    name: "Google Business Profile",
    short: "Your actual live listing on Google Maps",
    description:
      "Operational status, category, website and phone links, address, hours, rating, review volume and recency, and photo coverage — read directly from your live Google Business Profile via Google's Places API.",
    color: "#a78bfa",
  },
};

// The three website-audit categories, kept separate from AUDIT_CATEGORIES.GBP
// so marketing copy that talks about "three surfaces" stays accurate — a
// URL/HTML/Text audit never touches the live Business Profile.
export const WEBSITE_AUDIT_CATEGORIES = {
  SEO: AUDIT_CATEGORIES.SEO,
  AEO: AUDIT_CATEGORIES.AEO,
  GEO: AUDIT_CATEGORIES.GEO,
};

// Written as questions people actually type, with answers short enough for an
// answer engine to lift whole. These render on the page AND as FAQPage schema.
export const HOME_FAQ = [
  {
    q: "What is Growlocal?",
    a: "Growlocal is a done-for-you local marketing service for business owners. We run your Google Business Profile, review replies, website SEO and AI search visibility every week, and report results from your real Google numbers. It replaces hiring a local marketing agency.",
  },
  {
    q: "Is Growlocal an agency or software?",
    a: "Neither, exactly. Like an agency, we do the work — you don't log in to operate anything. Unlike an agency, the work is planned and tracked by software, every change is logged, and results are measured from your own Google Performance numbers rather than activity reports.",
  },
  {
    q: "What do I have to do?",
    a: "Very little. Add us as a Manager on your Google Business Profile, answer a few questions about your services, and reply on WhatsApp when a change needs your OK — like editing your business hours or replying to a negative review. Sending us a few photos a month helps.",
  },
  {
    q: "How do you access my Google Business Profile without my password?",
    a: "You add us as a Manager from your own Business Profile settings — a standard Google feature. We never ask for your Google password, and you can remove our access from the same screen at any time.",
  },
  {
    q: "Do you guarantee rankings or leads?",
    a: "No, and nobody honestly can. We commit to doing the work every week and showing you exactly what changed — calls, direction requests, website clicks and profile views from your Google Performance data, before and after.",
  },
  {
    q: "How much does Growlocal cost?",
    a: "The visibility audit and growth proposal are free. Growlocal Managed is ₹4,999 (Essentials) or ₹9,999 (Growth) per location per month plus GST, depending on how much there is to fix — your proposal shows which. No long contract.",
  },
  {
    q: "What is the difference between SEO, AEO and GEO?",
    a: "SEO optimises for a ranking position on Google's results page. AEO (Answer Engine Optimization) optimises to be the source an AI quotes inside a generated answer. GEO (Generative and Geographic Optimization) covers both generative-AI visibility and local signals like LocalBusiness schema that decide whether you appear for 'near me' searches.",
  },
  {
    q: "Which businesses is Growlocal for?",
    a: "Local businesses where customers search before they visit — clinics, dentists, diagnostic labs, restaurants, salons, gyms, hotels and professional services. These are the searches Google Maps and AI assistants answer by naming two or three specific businesses.",
  },
];

// Ordered steps, also emitted as HowTo schema.
export const HOW_IT_WORKS = [
  { name: "Get your free audit", text: "Paste your website or Google Maps link. You see exactly what's missing on Google, Maps and AI search — free, no signup." },
  { name: "We decide what to fix first", text: "Instead of a 50-page report, you get the few changes that matter most this week, ranked by impact." },
  { name: "We do the work", text: "We update your Google profile, reply to reviews and fix your website. Anything risky waits for your OK on WhatsApp." },
  { name: "You see the results", text: "Each month, a short report from your real Google numbers — calls, directions, website clicks — before and after each change." },
];

export const NAV = [
  { href: "/managed", label: "How it works" },
  { href: "/audit", label: "Free audit" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

export const FOOTER_NAV = {
  Service: [
    { href: "/managed", label: "Growlocal Managed" },
    { href: "/audit", label: "Free visibility audit" },
    { href: "/tools", label: "Free tools" },
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
