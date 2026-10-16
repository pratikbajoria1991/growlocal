import { ToolLanding, toolMetadata } from "@/components/tools/ToolLanding";
import { KeywordIdeasTool } from "@/components/tools/KeywordIdeasTool";

const PATH = "/tools/keyword-ideas";
const TITLE = "Free Keyword Research Tool for Local SEO";
const DESCRIPTION = "Free keyword research tool. Get hundreds of real Google searches for your service and area, grouped into local, question and ready-to-buy. No signup.";

export const metadata = toolMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const STEPS = [
  { name: "Enter your service", text: "Type what you offer, like dentist or interior designer, and optionally your area." },
  { name: "We ask Google", text: "We collect Google's live search suggestions for your service, area, questions and every letter of the alphabet." },
  { name: "Use them where they fit", text: "Put local searches on your Google profile and service pages, and answer the questions in an FAQ." },
];

const FAQ = [
  { q: "Where do these keywords come from?", a: "From Google's own search suggestions, the list that appears as people type. Every idea is something people actually search." },
  { q: "Does it show search volume?", a: "No. Google's suggestions don't include volumes, so we group ideas by intent instead. Paid tools like Semrush and Ahrefs estimate volumes from their own data." },
  { q: "What are question keywords for?", a: "Questions are what people ask Google and AI assistants. Answering them clearly in an FAQ helps you show up in both." },
  { q: "Why add my area?", a: "Local businesses win on local searches. Adding your area surfaces searches like best dentist in your neighbourhood." },
  { q: "How should I use these keywords?", a: "Use the words naturally in your page titles, service pages, Google Business Profile description and FAQ. Don't repeat them unnaturally." },
  { q: "Is it free and do I need to sign up?", a: "It is free and needs no signup or email." },
];

export default function Page() {
  return (
    <ToolLanding
      path={PATH}
      title={TITLE}
      description={DESCRIPTION}
      crumb="Keyword ideas"
      h1="Free keyword research tool for local businesses"
      intro="A keyword research tool shows the exact words people type into Google about your service. Enter your service and area and get hundreds of real searches, grouped by what the searcher wants."
      howToName="How to find keywords for a local business"
      steps={STEPS}
      related={[{ href: "/tools/maps-rank", label: "Google Maps rank checker" }, { href: "/tools/ai-answer", label: "AI answer check" }, { href: "/tools/schema-generator", label: "Schema generator" }]}
      faq={FAQ}
    >
      <KeywordIdeasTool />
    </ToolLanding>
  );
}
