import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import logoMark from "../../../../public/images/logo-mark.png";
import logoFull from "../../../../public/images/logo-full.png";

const navLinks = [
  { href: "/sales", label: "Dashboard" },
  { href: "/sales/stock", label: "Stock" },
  { href: "/sales/sales", label: "Sales" },
  { href: "/sales/notes", label: "Notes" },
  { href: "/sales/history", label: "History" },
];

export default async function SalesDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 bg-brand-charcoal">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/sales" className="flex items-center gap-2">
              <Image src={logoMark} alt="DePalace" className="h-9 w-auto" priority />
              <span className="font-serif text-lg text-brand-cream">
                DePalace Sales
              </span>
            </Link>
            <nav className="hidden gap-6 text-sm text-brand-cream/80 sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-brand-gold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-brand-cream/80">
            <span className="hidden sm:inline">{session?.user?.name}</span>
            <SignOutButton />
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-brand-cream/10 px-6 py-2 text-sm text-brand-cream/80 sm:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap hover:text-brand-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="relative flex-1">
        <div className="fixed inset-0 z-0 overflow-hidden bg-brand-cream">
          <Image
            src={logoFull}
            alt=""
            fill
            className="object-contain object-center p-12 opacity-[0.06]"
          />
        </div>
        <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
