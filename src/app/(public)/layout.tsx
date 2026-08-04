import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { SiteNav } from "@/components/public/site-nav";
import logoMark from "../../../public/images/logo-mark.png";

const CONTACT_EMAIL = "depalaceileemu01@gmail.com";
const CONTACT_PHONE = "+2348100031386";
const CONTACT_PHONE_DISPLAY = "+234 810 003 1386";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="bg-brand-charcoal text-brand-cream/70">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-3">
          <div>
            <Image src={logoMark} alt="DePalace" className="h-12 w-auto" />
            <p className="mt-4 max-w-xs text-sm">
              Ilé Ému - a house of wine. Fresh palmwine, cold beers, and
              home-style food, served the way the culture intended.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium tracking-wide text-brand-gold uppercase">
              Explore
            </h3>
            <nav className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/" className="hover:text-brand-cream">
                Home
              </Link>
              <Link href="/menu" className="hover:text-brand-cream">
                Menu
              </Link>
              <Link href="/about" className="hover:text-brand-cream">
                About Us
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-medium tracking-wide text-brand-gold uppercase">
              Get in touch
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-2 hover:text-brand-cream"
              >
                <Mail className="size-4 shrink-0 text-brand-gold" />
                {CONTACT_EMAIL}
              </a>
              <a
                href={`tel:${CONTACT_PHONE}`}
                className="flex items-center gap-2 hover:text-brand-cream"
              >
                <Phone className="size-4 shrink-0 text-brand-gold" />
                {CONTACT_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-cream/10 px-6 py-6 text-center text-xs text-brand-cream/50">
          © {new Date().getFullYear()} DePalace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
