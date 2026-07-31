"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { BRAND, NAV } from "@/lib/brand";
import { Logo } from "./Logo";

export function Nav({ user }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-canvas-50/80 border-b hairline">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="w-7 h-7" />
          <span className="font-display text-lg tracking-tight">{BRAND.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="px-3 py-2 rounded-lg text-forest-900/60 hover:text-forest-900 hover:bg-forest-900/5 transition-colors">
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link href="/app" className="ml-2 px-4 py-2 rounded-lg bg-forest-900 text-canvas-50 hover:bg-forest-800 transition-colors font-medium inline-flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-forest-900/60 hover:text-forest-900 transition-colors">Sign in</Link>
              <Link href="/audit" className="ml-1 px-4 py-2 rounded-lg bg-forest-900 text-canvas-50 hover:bg-forest-800 transition-colors font-medium">
                Free audit
              </Link>
            </>
          )}
        </nav>

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
            <Link href={user ? "/app" : "/login"} onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-lime-600">
              {user ? "Dashboard →" : "Sign in →"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
