// Blog content.
//
// Sourcing note, stated plainly: these questions are drawn from the recurring
// patterns in r/SEO, r/juststart, r/smallbusiness, SEO discussion on X, and the
// question-shapes AnswerThePublic surfaces for "AEO", "GEO" and "local SEO".
// They are representative of what practitioners actually ask — not scraped
// verbatim from any single thread, and no user's words are reproduced.
//
// Each post is written in answer-engine shape: a question title, a direct
// opening answer, question-format section headings, and its own FAQ block.

export const POSTS = [
  {
    slug: "how-to-get-cited-by-chatgpt-and-perplexity",
    title: "How do I get my business cited by ChatGPT and Perplexity?",
    question: "How do I get my business cited by ChatGPT and Perplexity?",
    answer:
      "To get cited by an AI answer engine, publish content structured the way those systems extract it: a FAQ section with FAQPage schema, headings written as the questions customers actually type, and a one-sentence direct answer under each. AI systems lift self-contained sentences, so a tight 40-200 character answer beats a well-written paragraph almost every time.",
    published: "2026-07-28",
    tags: ["AEO", "AI search", "schema"],
    readingMinutes: 7,
    sourceNote: "Recurring question across r/SEO and SEO discussion on X through 2026.",
    sections: [
      {
        heading: "Why don't AI engines mention my site?",
        body: "Almost always one of three reasons. Your content has no structured data, so the system can't confidently identify what your page is about. Your headings are labels rather than questions, so nothing matches the user's phrasing. Or your answers are buried three paragraphs into a section, so there is no clean sentence to lift. Fix those and citation rates change materially — the underlying content usually doesn't need rewriting at all.",
      },
      {
        heading: "What exactly does an AI engine look for?",
        list: [
          "FAQPage schema — question-and-answer pairs already in the shape a generated answer needs.",
          "Question-format headings that match how people phrase queries out loud.",
          "A definitional opening: '<Thing> is <what it is>.' This construction gets quoted disproportionately often.",
          "Author and organisation metadata, which feeds the E-E-A-T signals these systems weight heavily.",
          "Self-contained paragraphs between roughly 40 and 320 characters.",
        ],
      },
      {
        heading: "Does traditional SEO still matter for AI citation?",
        body: "Yes, and more than most people expect. Perplexity and Google's AI Overviews both lean on conventional search rankings to decide which sources are worth reading in the first place. AEO is a layer on top of solid SEO, never a replacement for it. If you rank nowhere, no amount of schema will get you quoted.",
      },
      {
        heading: "How long does it take to see a difference?",
        body: "Schema changes get picked up within days to a few weeks, depending on crawl frequency. Content restructuring compounds over one to three months. The honest answer is that nobody can promise a citation — these systems are non-deterministic and change without notice. What you can control is whether your page is even eligible to be quoted.",
      },
      {
        heading: "What should I do first?",
        body: "Add a genuine FAQ section covering 15 to 25 real customer questions, marked up with FAQPage JSON-LD. It is the single highest-leverage change available to most sites, and it usually takes an afternoon. Run a free audit to see whether yours already has one.",
      },
    ],
    faq: [
      {
        q: "Does adding FAQ schema guarantee an AI will cite me?",
        a: "No. Schema makes your content eligible and easy to extract, but AI answer engines are non-deterministic and weigh authority, relevance and freshness too. Schema moves the odds significantly; it does not guarantee an outcome.",
      },
      {
        q: "Should I write content specifically for AI instead of humans?",
        a: "No. AI systems detect and downrank thin, machine-written filler. The structure that helps AI extract your content — clear questions, direct answers, short paragraphs — is the same structure that helps humans skim. Write for people, structure for machines.",
      },
      {
        q: "How many FAQs should a page have?",
        a: "Fifteen to twenty-five covering genuinely distinct customer questions. Beyond that you tend to repeat yourself, and thin duplicate questions can dilute the page rather than strengthen it.",
      },
    ],
  },

  {
    slug: "local-business-not-showing-up-near-me-searches",
    title: "Why is my business not showing up in 'near me' searches?",
    question: "Why is my business not showing up in 'near me' searches?",
    answer:
      "The most common cause is missing LocalBusiness schema. Without structured address, geo coordinates and areaServed fields, search engines and AI assistants have no machine-readable way to confirm where you are or which areas you serve — so you get filtered out of proximity queries before ranking is even considered.",
    published: "2026-07-25",
    tags: ["GEO", "local SEO", "Google Business Profile"],
    readingMinutes: 6,
    sourceNote: "Among the most frequent questions in r/smallbusiness and local-SEO communities.",
    sections: [
      {
        heading: "What decides who appears in a 'near me' search?",
        body: "Three things, in rough order: proximity to the searcher, prominence (reviews, citations, links), and relevance (does your listing and site actually match what they asked for). You cannot change physical proximity, but relevance and prominence are almost entirely within your control — and most local businesses are losing on relevance for purely technical reasons.",
      },
      {
        heading: "What is the first thing I should check?",
        list: [
          "Does your site have LocalBusiness JSON-LD with the most specific @type — Dentist, Restaurant, Hotel — rather than a generic one?",
          "Does the address in your schema match your Google Business Profile character for character?",
          "Are geo coordinates present? Right-click your exact spot in Google Maps to copy them.",
          "Is areaServed listed, covering every locality you serve rather than just where you sit?",
          "Is there a tel: link so mobile users can tap to call?",
        ],
      },
      {
        heading: "Does NAP consistency really matter?",
        body: "Yes, and it is the failure people underestimate most. If your Google Business Profile says 'Suite 4, 12 Park Street' and your website footer says '12 Park St, #4', those can be read as two different entities. Inconsistent name, address and phone across the web actively suppresses local rankings. Pick one exact format and use it everywhere.",
      },
      {
        heading: "How does this change with AI assistants?",
        body: "It gets stricter, not looser. When someone asks an assistant for a dentist nearby, the system needs structured data to decide who qualifies before it names two or three businesses. Free-text addresses in your footer are far weaker evidence than a properly formed PostalAddress object. Everything that helped in classic local SEO now matters more.",
      },
    ],
    faq: [
      {
        q: "Is my address in the website footer enough?",
        a: "It helps but it is not sufficient. Search engines and AI systems read structured data far more reliably than they parse free text. Put your NAP in both places, and make sure the two match exactly.",
      },
      {
        q: "How do I find my exact geo coordinates?",
        a: "Open Google Maps, right-click your business location, and the latitude and longitude appear at the top of the context menu. Click to copy, then paste into a GeoCoordinates object in your LocalBusiness schema.",
      },
      {
        q: "Do I need a separate page for each area I serve?",
        a: "Only if you can write genuinely distinct, useful content for each. Thin duplicated location pages hurt more than they help. If you serve five areas but only have real depth on two, list all five in areaServed and build proper pages for the two.",
      },
    ],
  },

  {
    slug: "what-is-geo-generative-engine-optimization",
    title: "What is GEO and is it different from AEO?",
    question: "What is GEO and is it different from AEO?",
    answer:
      "GEO (Generative Engine Optimization) is the practice of making your business legible and credible to generative AI systems. For local businesses it carries a second meaning too — geographic optimization, the structured signals that decide whether you appear for location-based queries. AEO is about format; GEO is about entity and place.",
    published: "2026-07-21",
    tags: ["GEO", "AEO", "definitions"],
    readingMinutes: 5,
    sourceNote: "Terminology confusion that surfaces constantly in AnswerThePublic data for 'GEO SEO'.",
    sections: [
      {
        heading: "How is GEO different from AEO in practice?",
        body: "AEO asks: can a machine extract a clean answer from this page? GEO asks: does a machine know who and where this business is, and does it trust that? You can score well on one and badly on the other. A beautifully structured FAQ page with no LocalBusiness schema will get quoted for general questions and ignored for local ones.",
      },
      {
        heading: "Why did the term become confusing?",
        body: "Because two communities adopted it at once. Researchers used GEO for generative-engine visibility. Local SEO practitioners had long used 'geo' as shorthand for geographic targeting. Both meanings are now in circulation and both are legitimate. In our audit we score them together, because for a local business they solve the same commercial problem: being the answer when someone nearby is ready to buy.",
      },
      {
        heading: "What does a good GEO setup look like?",
        list: [
          "LocalBusiness schema with a vertical-specific @type.",
          "PostalAddress matching your Google Business Profile exactly.",
          "GeoCoordinates with real latitude and longitude.",
          "areaServed covering every locality you actually serve.",
          "openingHoursSpecification so you qualify for 'open now' filters.",
          "A tel: link in the header and footer.",
          "Your city and neighbourhood named in the H1 and opening paragraph.",
        ],
      },
    ],
    faq: [
      {
        q: "Do I need to do both AEO and GEO?",
        a: "If you are a local business, yes. AEO gets you quoted for questions about what you do; GEO gets you surfaced when the query has location intent. Most buying journeys for local services involve both.",
      },
      {
        q: "Is GEO just a rebrand of local SEO?",
        a: "It overlaps heavily but is not identical. Local SEO focused on Google's local pack and Maps. GEO extends the same structured-data thinking to AI assistants that generate an answer instead of returning a list of links.",
      },
    ],
  },

  {
    slug: "does-schema-markup-actually-help-rankings",
    title: "Does schema markup actually help rankings?",
    question: "Does schema markup actually help rankings?",
    answer:
      "Schema markup is not a direct ranking factor, and Google has said so repeatedly. What it does is make your content eligible for rich results, help search engines understand entities on your page with confidence, and give AI answer engines a clean structure to extract from. The measurable wins are click-through rate and AI citation, not position.",
    published: "2026-07-17",
    tags: ["SEO", "schema", "structured data"],
    readingMinutes: 6,
    sourceNote: "Perennial debate in r/SEO — worth answering precisely rather than with hype.",
    sections: [
      {
        heading: "So is schema a waste of time?",
        body: "No, but it is often oversold. Adding schema will not move you from position nine to position two. What it reliably does: earns rich result eligibility, which lifts click-through on the ranking you already have; resolves entity ambiguity so Google is confident what your business is; and gives AI systems parseable structure. Those are real, they are just not 'rankings'.",
      },
      {
        heading: "Which schema types actually matter for a local business?",
        list: [
          "LocalBusiness with the most specific subtype available — the single highest-value block.",
          "FAQPage for the AI citation surface.",
          "Organization to establish entity identity and connect your social profiles.",
          "BreadcrumbList for hierarchy and a nicer results display.",
          "Article or BlogPosting on content pages, with a real author.",
          "Product or Service if you sell defined offerings.",
        ],
      },
      {
        heading: "How do I know if my schema is working?",
        body: "Validate it at Google's Rich Results Test, then watch Search Console for rich-result impressions over four to eight weeks. If you added FAQPage schema, check whether your answers begin appearing in AI Overviews. Do not judge it by rank movement, because that is not what it does.",
      },
      {
        heading: "What is the most common schema mistake?",
        body: "Marking up content that is not visible on the page. Google treats that as a guidelines violation and may issue a manual action. The schema must describe what a human actually sees — if you add FAQ schema, the questions and answers need to be genuinely rendered on the page.",
      },
    ],
    faq: [
      {
        q: "Should I use JSON-LD or microdata?",
        a: "JSON-LD. Google explicitly prefers it, it sits in one block in the head rather than being tangled through your markup, and it is far easier to maintain and validate.",
      },
      {
        q: "Can I have too much schema?",
        a: "You can have wrong schema, which is worse than none. Marking up content that is not visible, or using types that do not describe your page, risks a manual action. Accurate and modest beats extensive and sloppy.",
      },
      {
        q: "Does schema help with ChatGPT specifically?",
        a: "Indirectly. ChatGPT's browsing and retrieval surfaces read page structure, and well-formed schema makes extraction cleaner. There is no confirmed direct pipeline from your JSON-LD into a model, but structured pages are consistently easier for these systems to quote accurately.",
      },
    ],
  },
];

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug) || null;
}

export function allSlugs() {
  return POSTS.map((p) => p.slug);
}

export function sortedPosts() {
  return [...POSTS].sort((a, b) => new Date(b.published) - new Date(a.published));
}
