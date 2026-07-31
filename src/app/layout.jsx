import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/lib/brand";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.pitch,
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
    "website audit",
  ],
  alternates: { canonical: BRAND.url },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.pitch,
    url: BRAND.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.pitch,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport = {
  themeColor: "#0b1a12",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: BRAND.name,
              applicationCategory: "BusinessApplication",
              description: BRAND.pitch,
              url: BRAND.url,
              offers: [
                { "@type": "Offer", name: "Free", price: 0, priceCurrency: "INR" },
                { "@type": "Offer", name: "Autopilot", price: 4999, priceCurrency: "INR" },
                { "@type": "Offer", name: "Agency", price: 14999, priceCurrency: "INR" },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <Nav user={user ? { email: user.email } : null} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
