// FAQ copy for the inner pages. Each list renders on the page (FaqSection) and
// as FAQPage JSON-LD (faqSchema), so the visible text and the markup can't
// drift apart. Every answer restates a fact that already lives elsewhere on the
// site: prices and plan contents come from brand.js, the approval rules from
// AUTONOMY, and the audit behaviour from src/lib/audit.js. Answers stay inside
// 40-320 characters so an answer engine can lift them whole.

export const PRICING_FAQ = [
  {
    q: "How much does Growlocal cost?",
    a: "The visibility audit and the growth proposal are free. Growlocal Managed is ₹4,999 (Essentials) or ₹9,999 (Growth) per location per month, plus GST. Your free proposal shows which tier fits.",
  },
  {
    q: "Is the audit really free?",
    a: "Yes. The audit is free and unlimited, and you do not need to sign up. It scores your site for SEO, AEO and GEO out of 100 and explains every gap it finds.",
  },
  {
    q: "What is the difference between Essentials and Growth?",
    a: "The tier follows how much there is to fix. Essentials (₹4,999) suits a presence that is mostly in shape. Growth (₹9,999) suits a business with real ground to make up on nearby competitors.",
  },
  {
    q: "What does the Managed plan include?",
    a: "Eight Google Business Profile posts a month, replies to every new review, current services, attributes and photos, FAQ and schema on your website, directory listings, a monthly report, and approvals on WhatsApp.",
  },
  {
    q: "Is there a long contract?",
    a: "No. Managed plans bill monthly and cancel with 30 days notice. No payment is taken on this site; founding clients are invoiced after an onboarding call.",
  },
  {
    q: "Do the prices include GST?",
    a: "No. All prices on this page exclude GST, which is charged on top of the monthly price.",
  },
  {
    q: "What if I have more than one location?",
    a: "Multi-location pricing is custom and quoted per location. Email hello@growlocal.app with how many branches you have and where, and we will send per-location pricing.",
  },
  {
    q: "Do you guarantee rankings or leads?",
    a: "No, and nobody honestly can. We commit to doing the work every week and showing you what changed: calls, direction requests, website clicks and profile views from your own Google data.",
  },
];

export const CONTACT_FAQ = [
  {
    q: "How do I contact Growlocal?",
    a: "Email hello@growlocal.app for general questions, or support@growlocal.app if you need support. We do not publish a phone number or a street address.",
  },
  {
    q: "How do I get a free audit?",
    a: "Open the audit page, paste your website or Google Maps link, and you get scores out of 100 with the fix for every gap. It is free and needs no signup, so there is no need to email first.",
  },
  {
    q: "How do I get pricing for several branches?",
    a: "Email hello@growlocal.app with how many locations you have and where. We will send per-location pricing, because multi-location plans are priced by conversation rather than from a fixed list.",
  },
  {
    q: "Can I apply for Growlocal Managed without emailing?",
    a: "Yes. Use the application form on the Managed page, or ask for a free proposal first. There is nothing to pay until you decide to start.",
  },
  {
    q: "Will you ask for my Google password?",
    a: "No. You add us as a Manager on your Google Business Profile, and you can remove our access from the same settings screen at any time.",
  },
];

export const MANAGED_FAQ = [
  {
    q: "What does Growlocal Managed include?",
    a: "Eight Google Business Profile posts a month, replies to every new review, current services, attributes and photos, FAQ and schema on your website, directory listings, a monthly report, and approvals on WhatsApp.",
  },
  {
    q: "What does Growlocal Managed cost?",
    a: "It is ₹4,999 (Essentials) or ₹9,999 (Growth) per location per month, plus GST, depending on how much there is to fix. Your free proposal shows which tier applies. Billing is monthly.",
  },
  {
    q: "Which changes need my approval?",
    a: "Changes to your business name, category, address, hours or description, replies to negative or health-related reviews, and new or rewritten website pages and articles. We handle routine work without asking.",
  },
  {
    q: "Do you need my Google password?",
    a: "No. You add us as a Manager from your own Business Profile settings, which is a standard Google feature. You can remove our access from the same screen whenever you like.",
  },
  {
    q: "Can I cancel Growlocal Managed?",
    a: "Yes. Managed plans bill monthly and cancel with 30 days notice. There is no long contract, and no payment is taken on this site. Founding clients are invoiced after an onboarding call.",
  },
  {
    q: "Do you guarantee rankings or leads?",
    a: "No, and nobody honestly can. We commit to doing the work every week and showing you what changed: calls, direction requests, website clicks and profile views from your own Google data.",
  },
  {
    q: "What is planned but not included yet?",
    a: "Instant publishing through Google's API and neighbourhood map-rank tracking are planned, not included. Instant publishing is waiting on Google's approval of our app.",
  },
];

export const AUDIT_FAQ = [
  {
    q: "What does the Growlocal audit check?",
    a: "It scores your page out of 100 on three surfaces: SEO for Google rankings, AEO for AI answer engines, and GEO for local search. Every check lists the exact fix.",
  },
  {
    q: "Is the audit free?",
    a: "Yes. Audits are free and unlimited, and you do not need to sign up or enter a card.",
  },
  {
    q: "Which input should I use: URL, HTML, Text or GBP?",
    a: "URL fetches the live page. HTML scores pasted page source and works behind a firewall. Text scores content structure only. GBP scores your live Google Business Profile from a Maps link.",
  },
  {
    q: "What if my site blocks the audit?",
    a: "If a site blocks our fetch, we retry through a reader proxy. If that also fails, paste the page HTML into the HTML tab and you get the same full audit.",
  },
  {
    q: "Does a high score guarantee rankings?",
    a: "No. The score measures how ready a page is for Google and AI answer engines. It does not predict rankings, AI citations or leads.",
  },
];

// The steps behind the audit, rendered on /audit and emitted as HowTo JSON-LD.
export const AUDIT_STEPS = [
  { name: "Choose what to audit", text: "Pick the URL, HTML, Text or GBP tab and enter your website, your page source, your copy or your Google Maps link." },
  { name: "We read the page", text: "We fetch the page and parse its HTML and structured data, or read your live Google Business Profile for a Maps link." },
  { name: "We score it", text: "SEO, AEO and GEO are each scored out of 100, with every check shown as passed, partial or failed." },
  { name: "You get the fixes", text: "Each gap comes with a plain-language fix, and the biggest ones are listed first." },
];

export const TOOLS_FAQ = [
  {
    q: "Are the Growlocal tools free?",
    a: "Yes. Every tool is free and needs no signup. The full audit is free too and scores SEO, AEO and GEO out of 100.",
  },
  {
    q: "What does the AI Crawler Check look at?",
    a: "It reads your robots.txt and checks whether AI crawlers such as GPTBot, ClaudeBot, PerplexityBot and Google-Extended are allowed in. Blocking them keeps you out of AI answers.",
  },
  {
    q: "What does the Schema Generator do?",
    a: "You fill in your business details and it produces LocalBusiness, FAQPage and Organization JSON-LD to paste into your page head. It needs no account, and nothing is sent to a server.",
  },
  {
    q: "What does Competitor Compare show?",
    a: "It audits two sites at once and lists the checks your competitor passes that you fail, ranked by the points you would recover from closing each gap.",
  },
  {
    q: "Which tool should I start with?",
    a: "Start with the full audit to see where you stand. Then check your Google Maps ranking, run the Site Audit for technical problems, and use the AI Answer Check to see whether AI assistants recommend you.",
  },
  {
    q: "Are these free tools like Semrush or Ahrefs?",
    a: "They cover the same jobs for a local business: site audit, keyword research, rank checking, backlinks and AI visibility. They check live, one site at a time, and don't estimate search volumes or count every backlink on the web the way paid tools do.",
  },
];

export const BLOG_FAQ = [
  {
    q: "What is the Growlocal blog about?",
    a: "It answers questions people ask about Answer Engine Optimization, Generative Engine Optimization, schema markup and local search visibility. Each post gives one direct answer first, then the detail.",
  },
  {
    q: "What is the difference between SEO, AEO and GEO?",
    a: "SEO aims for a ranking position on Google. AEO aims to be the source an AI quotes in its answer. GEO covers generative-AI visibility plus local signals that decide whether you appear for near me searches.",
  },
  {
    q: "Where do the blog topics come from?",
    a: "From questions that recur in SEO communities and practitioner discussion, and from the question shapes that keyword tools surface. Posts start from a real question rather than a keyword list.",
  },
  {
    q: "Who writes the Growlocal blog?",
    a: "Posts are published under the name of Growlocal's founder, Pratik Bajoria, and each one carries its publish date and reading time.",
  },
  {
    q: "How do I check whether my site is ready for AI search?",
    a: "Run the free audit. It scores your page out of 100 for AEO, checking FAQ schema, question headings, direct answers, author metadata and paragraph length, and lists the fix for each gap.",
  },
];
