"use client";
import { usePathname } from "next/navigation";

// Preview websites are a business's own site, not a Growlocal page — hide
// Growlocal's nav and footer there.
export function SiteChrome({ children }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/preview/")) return null;
  return children;
}
