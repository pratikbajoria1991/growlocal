import { ToolLanding, toolMetadata } from "@/components/tools/ToolLanding";
import { MapsRankTool } from "@/components/tools/MapsRankTool";

const PATH = "/tools/maps-rank";
const TITLE = "Free Google Maps Rank Checker";
const DESCRIPTION = "Free Google Maps rank checker. See where your business ranks on Maps for any search and area, and compare ratings and reviews with the top 3. No signup.";

export const metadata = toolMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const STEPS = [
  { name: "Enter your business", text: "Use your business name as it appears on Google, or your website." },
  { name: "Choose the search and area", text: "Type what customers search, like dentist, and the area, like a neighbourhood and city." },
  { name: "Compare with the top three", text: "See your position, and the ratings and review counts of the businesses above you." },
];

const FAQ = [
  { q: "How does the Maps rank checker work?", a: "It runs your search through Google's Places data, which returns businesses in the order Google ranks them, and finds your position." },
  { q: "Why is my position different on my phone?", a: "Google Maps also weighs how close the searcher is. This tool checks the search as typed for the area, not from one particular street." },
  { q: "Why can't the tool find my business?", a: "Check the name matches your Google listing exactly, or enter your website instead. If you're outside the top 20, you won't appear." },
  { q: "How do I rank higher on Google Maps?", a: "Complete your Google Business Profile, choose the right categories, earn steady reviews, post updates, and make sure your website matches your profile." },
  { q: "Is this like the Semrush or Ahrefs rank tracker?", a: "It checks Maps positions on demand. Paid trackers check many keywords daily and chart them over time." },
  { q: "Is it free and do I need to sign up?", a: "It is free and needs no signup or email." },
];

export default function Page() {
  return (
    <ToolLanding
      path={PATH}
      title={TITLE}
      description={DESCRIPTION}
      crumb="Maps rank checker"
      h1="Free Google Maps rank checker"
      intro="A Google Maps rank checker shows where your business appears when people search for your service in an area. Enter your business, the search and the area, and see your position in the top 20."
      howToName="How to check your Google Maps ranking"
      steps={STEPS}
      related={[{ href: "/tools/keyword-ideas", label: "Keyword research tool" }, { href: "/tools/backlink-finder", label: "Backlink & citation finder" }, { href: "/tools/ai-answer", label: "AI answer check" }]}
      faq={FAQ}
    >
      <MapsRankTool />
    </ToolLanding>
  );
}
