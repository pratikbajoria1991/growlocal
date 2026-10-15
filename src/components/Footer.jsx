import Link from "next/link";
import { Mail } from "lucide-react";
import { BRAND, FOOTER_NAV } from "@/lib/brand";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t hairline mt-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <Logo className="w-6 h-6" />
              <span className="font-display text-base">{BRAND.name}</span>
            </Link>
            <p className="text-sm text-forest-900/70 leading-relaxed max-w-xs mb-4">{BRAND.tagline}</p>

            <a href={`mailto:${BRAND.email}`} className="inline-flex items-center gap-2 text-sm text-forest-900/65 hover:text-forest-900 transition-colors">
              <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {BRAND.email}
            </a>
          </div>

          {Object.entries(FOOTER_NAV).map(([group, links]) => (
            <nav key={group} aria-label={group}>
              <h2 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-3">{group}</h2>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-forest-900/65 hover:text-forest-900 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 pt-5 border-t hairline flex flex-col sm:flex-row justify-between gap-2 text-xs text-forest-900/65">
          <div>© {new Date().getFullYear()} {BRAND.name}</div>
          <div>Serving businesses across {BRAND.country}</div>
        </div>
      </div>
    </footer>
  );
}
