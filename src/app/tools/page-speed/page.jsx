import { ToolLanding, toolMetadata } from "@/components/tools/ToolLanding";
import { PageSpeedTool } from "@/components/tools/PageSpeedTool";

const PATH = "/tools/page-speed";
const TITLE = "Free Website Speed Test (Core Web Vitals)";
const DESCRIPTION = "Free website speed test using Google PageSpeed Insights. Get your speed score, Core Web Vitals from real visitors and the biggest fixes. No signup.";

export const metadata = toolMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const STEPS = [
  { name: "Enter a page", text: "Use your homepage or any page you want customers to land on." },
  { name: "Google loads it", text: "Google's Lighthouse loads the page on a simulated phone or desktop and measures each step." },
  { name: "Fix the biggest delays", text: "Start with the fixes that save the most time, then test again." },
];

const FAQ = [
  { q: "What is a good page speed score?", a: "90 or more is good, 50 to 89 needs work, and under 50 is poor. Mobile scores are usually lower than desktop." },
  { q: "What are Core Web Vitals?", a: "Google's three measures of real visitor experience: how fast the main content loads (LCP), how quickly the page responds (INP) and how much it jumps around (CLS)." },
  { q: "Does page speed affect Google ranking?", a: "Yes, a little. Core Web Vitals are a ranking signal, and slow pages lose visitors before they ever see your offer." },
  { q: "Why does my score change each time?", a: "Each test is a fresh load, and network and server timing vary. A few points either way is normal." },
  { q: "Why is there no real-visitor data?", a: "Google only shows Chrome user data for sites with enough traffic. Smaller sites get lab results only." },
  { q: "Is it free and do I need to sign up?", a: "It is free and needs no signup or email." },
];

export default function Page() {
  return (
    <ToolLanding
      path={PATH}
      title={TITLE}
      description={DESCRIPTION}
      crumb="Page speed test"
      h1="Free website speed test"
      intro="A website speed test measures how fast your page loads and becomes usable. Enter a page and Google loads it on a mid-range phone, then shows your score, Core Web Vitals and what slows it down."
      howToName="How to test your website speed"
      steps={STEPS}
      related={[{ href: "/tools/site-audit", label: "Site audit" }, { href: "/tools/ai-visibility", label: "AI crawler check" }, { href: "/tools/compare", label: "Competitor compare" }]}
      faq={FAQ}
    >
      <PageSpeedTool />
    </ToolLanding>
  );
}
