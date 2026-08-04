import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/public/reveal";
import { PalmDivider, PalmIcon } from "@/components/public/palm-icon";
import heroImage from "../../../public/images/hero.jpg";
import storyImage from "../../../public/images/story.jpg";
import logoMark from "../../../public/images/logo-mark.png";

const features = [
  {
    title: "Tapped fresh, daily",
    body: "No shortcuts, our palmwine comes straight from the source and is served the same day.",
  },
  {
    title: "Home-style food",
    body: "Asun, Bushmeat, Swallow, Proteins, and more cooked the way you'd find at home, not a restaurant.",
  },
  {
    title: "No fuss to order",
    body: "Scan the QR code on your table, see the menu and prices instantly. No app, no login.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 text-center text-brand-cream">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/70 to-brand-charcoal/40" />

        <div className="relative animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
          <Image
            src={logoMark}
            alt="DePalace"
            className="mx-auto h-20 w-auto"
            priority
          />
          <p className="mt-2 text-sm tracking-[0.35em] text-brand-gold uppercase">
            Ilé Ému
          </p>
          <h1 className="mt-3 font-serif text-5xl sm:text-6xl">DePalace</h1>
          <p className="mt-4 max-w-md text-brand-cream/80">
            Fresh palmwine, cold beers, and home-style food served the way the culture intended.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/menu">
              <Button
                size="lg"
                className="bg-brand-gold text-brand-charcoal shadow-lg shadow-brand-gold/20 transition-transform hover:scale-105 hover:bg-brand-gold/90"
              >
                See full menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-brand-cream px-6 py-20">
        <Reveal className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-2 sm:items-center">
          <div className="relative aspect-square overflow-hidden rounded-lg shadow-xl">
            <Image
              src={storyImage}
              alt="DePalace, under the palms"
              fill
              className="object-cover"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </div>
          <div>
            <PalmDivider className="mb-4 justify-start text-brand-gold" />
            <h2 className="font-serif text-3xl text-brand-green">
              A house of wine
            </h2>
            <p className="mt-4 text-brand-charcoal/80">
              &ldquo;Ilé Ému&rdquo; means house of wine - a place to slow down, share a calabash, and enjoy palmwine the way it&apos;s
              always been done. Every bottle is tapped fresh, and every plate is made the way you&apos;d find at home.
            </p>
            <Link
              href="/about"
              className="mt-4 inline-block text-sm font-medium text-brand-green underline underline-offset-4 hover:text-brand-green/80"
            >
              Read our story →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Why DePalace */}
      <section className="relative overflow-hidden bg-brand-charcoal px-6 py-20 text-brand-cream">
        <PalmIcon className="pointer-events-none absolute -right-8 -top-8 size-48 text-brand-gold/10" />
        <PalmIcon className="pointer-events-none absolute -bottom-10 -left-10 size-48 rotate-180 text-brand-gold/10" />

        <Reveal className="relative mx-auto max-w-4xl text-center">
          <PalmDivider className="mb-4 text-brand-gold" />
          <h2 className="font-serif text-3xl">Why DePalace</h2>
        </Reveal>

        <div className="relative mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delayMs={index * 120}>
              <div className="rounded-lg border border-brand-cream/10 bg-brand-cream/5 p-6 text-left">
                <h3 className="font-serif text-lg text-brand-gold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-brand-cream/70">
                  {feature.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Menu CTA */}
      <section className="bg-brand-cream px-6 py-24">
        <Reveal className="mx-auto max-w-2xl rounded-2xl border border-brand-green/10 bg-white p-10 text-center shadow-sm">
          <PalmDivider className="mb-4 text-brand-green" />
          <h2 className="font-serif text-3xl text-brand-green">
            Hungry or thirsty?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-brand-charcoal/70">
            The full menu, with prices, is one tap away, no account, no
            download.
          </p>
          <Link href="/menu" className="mt-6 inline-block">
            <Button
              size="lg"
              className="bg-brand-green text-brand-cream shadow-lg shadow-brand-green/20 transition-transform hover:scale-105 hover:bg-brand-green/90"
            >
              See full menu
            </Button>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
