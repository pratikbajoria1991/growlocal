"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, ArrowRight } from "lucide-react";
import { BRAND, NAV } from "@/lib/brand";
import { Logo } from "./Logo";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  // Pages are statically cached, so sign-in state is read after load.
  useEffect(() => {
    let live = true;
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then((d) => { if (live && d?.email) setUser({ email: d.email }); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-canvas-50/90 border-b hairline">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-[4.5rem] flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Logo className="w-7 h-7" />
          <span className="font-display text-xl font-bold tracking-[-0.04em]">{BRAND.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-[15px]">
          {NAV.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`px-3.5 py-2 rounded-full font-medium transition-colors ${
                  active ? "text-forest-900 bg-forest-900/[0.06]" : "text-forest-900/70 hover:text-forest-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <Link href="/app" className="px-5 py-2.5 btn-premium inline-flex items-center gap-1.5 text-sm">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-5 py-2 btn-ghost text-sm text-forest-900">Sign in</Link>
              <Link href="/audit" className="px-5 py-2.5 btn-premium text-sm inline-flex items-center gap-1.5">
                Free audit <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </>
          )}
        </div>

        <button aria-label="Menu" onClick={() => setOpen(!open)} className="md:hidden p-2 -mr-2">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t hairline bg-canvas-50">
          <nav className="px-5 py-3 flex flex-col">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-sm text-forest-900/80 border-b hairline">
                {l.label}
              </Link>
            ))}
            <Link href={user ? "/app" : "/login"} onClick={() => setOpen(false)} className="mt-3 mb-1 py-3 btn-premium text-sm text-center">
              {user ? "Dashboard →" : "Sign in →"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
