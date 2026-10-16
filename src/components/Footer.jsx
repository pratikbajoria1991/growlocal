import Link from "next/link";
import { Mail } from "lucide-react";
import { BRAND, FOOTER_NAV } from "@/lib/brand";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 bg-forest-900 text-canvas-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <Logo className="w-7 h-7" />
              <span className="font-display text-xl font-bold tracking-[-0.04em]">{BRAND.name}</span>
            </Link>
            <p className="text-sm text-canvas-50/70 leading-relaxed max-w-xs mb-4">{BRAND.tagline}</p>

            <a href={`mailto:${BRAND.email}`} className="inline-flex items-center gap-2 text-sm text-canvas-50/75 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {BRAND.email}
            </a>
          </div>

          {Object.entries(FOOTER_NAV).map(([group, links]) => (
            <nav key={group} aria-label={group}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-300 mb-4">{group}</h2>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-canvas-50/75 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-canvas-50/10 flex flex-col sm:flex-row justify-between gap-2 text-xs text-canvas-50/60">
          <div>© {new Date().getFullYear()} {BRAND.name}</div>
          <div>Serving businesses across {BRAND.country}</div>
        </div>
      </div>
    </footer>
  );
}
