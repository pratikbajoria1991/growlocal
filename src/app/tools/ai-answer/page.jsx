import { ToolLanding, toolMetadata } from "@/components/tools/ToolLanding";
import { AiAnswerTool } from "@/components/tools/AiAnswerTool";

const PATH = "/tools/ai-answer";
const TITLE = "Free AI Answer Check: Does AI Recommend You?";
const DESCRIPTION = "Free AI answer check. Ask Google's Gemini who the best business for your service and area is, see if you're named, and which sites it learns from.";

export const metadata = toolMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const STEPS = [
  { name: "Enter your business and service", text: "Type your business name, your service, and the area you serve." },
  { name: "We ask Gemini with Google Search", text: "We ask Google's Gemini the customer's question and read its full answer." },
  { name: "Get into the sources", text: "If you're not named, get listed and reviewed on the sites the AI used for its answer." },
];

const FAQ = [
  { q: "Why does it matter if AI recommends me?", a: "More customers now ask ChatGPT, Gemini or Google's AI Overviews for recommendations. If you're not named, you're not considered." },
  { q: "Which AI does this check?", a: "Google's Gemini, with Google Search turned on, which is close to how Google's AI Overviews build answers." },
  { q: "Will ChatGPT give the same answer?", a: "Not always. Each assistant uses different sources, and answers change between runs. Treat this as one snapshot." },
  { q: "How do I get AI to recommend my business?", a: "Be listed and well reviewed on the sites AI reads, keep your Google profile complete, and answer common questions clearly on your website." },
  { q: "Is this like the AI visibility tools in Semrush or Ahrefs?", a: "It checks one question live. Paid tools track many prompts across several AI assistants over time." },
  { q: "Is it free and do I need to sign up?", a: "It is free and needs no signup or email." },
];

export default function Page() {
  return (
    <ToolLanding
      path={PATH}
      title={TITLE}
      description={DESCRIPTION}
      crumb="AI answer check"
      h1="Does AI recommend your business?"
      intro="An AI answer check asks an AI assistant the question your customers ask, like best dentist in Salt Lake, and shows whether your business is named. You also see the websites the answer was built from."
      howToName="How to check if AI assistants recommend your business"
      steps={STEPS}
      related={[{ href: "/tools/ai-visibility", label: "AI crawler check" }, { href: "/tools/backlink-finder", label: "Backlink & citation finder" }, { href: "/tools/keyword-ideas", label: "Keyword research tool" }]}
      faq={FAQ}
    >
      <AiAnswerTool />
    </ToolLanding>
  );
}
