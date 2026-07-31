import "./globals.css";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/lib/brand";
import { getCurrentUser } from "@/lib/session";
import { JsonLd, organizationSchema, webSiteSchema, softwareSchema } from "@/lib/schema";

// Self-hosted at build time — no request to fonts.googleapis.com on page load,
// no render-blocking stylesheet, no layout shift when the font swaps in.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.metaDescription,
  applicationName: BRAND.name,
  authors: [{ name: "Pratik Bajoria", url: BRAND.url }],
  creator: "Pratik Bajoria",
  publisher: BRAND.name,
  keywords: [
    "SEO audit tool",
    "AEO audit",
    "GEO audit",
    "Answer Engine Optimization",
    "Generative Engine Optimization",
    "Google Business Profile automation",
    "GBP autopilot",
    "local SEO tool",
    "AI search visibility",
    "free website audit",
    "schema markup checker",
    "get cited by ChatGPT",
  ],
  alternates: { canonical: BRAND.url },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.pitch,
    url: BRAND.url,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.pitch,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  category: "technology",
};

export const viewport = {
  themeColor: "#0b1a12",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${display.variable} ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <JsonLd data={organizationSchema()} />
        <JsonLd data={webSiteSchema()} />
        <JsonLd data={softwareSchema()} />
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-forest-900 focus:text-canvas-50 focus:text-sm"
        >
          Skip to content
        </a>
        <Nav user={user ? { email: user.email } : null} />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
