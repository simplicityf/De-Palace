"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import logoMark from "../../../public/images/logo-mark.png";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About Us" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-brand-charcoal/95 backdrop-blur supports-backdrop-filter:bg-brand-charcoal/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image src={logoMark} alt="DePalace" className="h-9 w-auto" priority />
          <span className="font-serif text-lg text-brand-cream">DePalace</span>
        </Link>

        <nav className="hidden gap-8 text-sm text-brand-cream/80 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-brand-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          className="text-brand-cream sm:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-brand-cream/10 bg-brand-charcoal px-6 py-4 text-brand-cream/80 sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-2 transition-colors hover:bg-brand-cream/5 hover:text-brand-gold"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
