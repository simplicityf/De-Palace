import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/public/reveal";
import { PalmDivider, PalmIcon } from "@/components/public/palm-icon";
import heroImage from "../../../../public/images/hero.jpg";
import storyImage from "../../../../public/images/story.jpg";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 text-center text-brand-cream">
        <Image 
          src={storyImage} 
          alt="" 
          fill 
          className="object-cover" 
          sizes="100vw"
          priority
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal/60 to-brand-charcoal/80" />
        <div className="relative z-10 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
          <p className="text-xs sm:text-sm tracking-[0.35em] text-brand-gold uppercase mb-2">
            Our story
          </p>
          <h1 className="mt-2 sm:mt-3 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            About DePalace
          </h1>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-brand-cream px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <PalmDivider className="mb-4 sm:mb-6 text-brand-gold" />
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-brand-green mb-4 sm:mb-6">
            Ilé Ému — a house of wine
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-brand-charcoal/80 leading-relaxed max-w-2xl mx-auto">
            In Yoruba, &ldquo;Ilé Ému&rdquo; means house of wine. That&apos;s
            what DePalace has always been — a place under the palms to slow
            down, share a calabash with people you like, and enjoy palmwine
            the way it&apos;s always been done, long before it had a fancy
            label on it.
          </p>
        </Reveal>
      </section>

      {/* Fresh Not Processed Section */}
      <section className="relative overflow-hidden bg-brand-charcoal px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-brand-cream">
        <PalmIcon className="pointer-events-none absolute -right-10 top-10 size-40 sm:size-48 md:size-56 text-brand-gold/10" />
        <PalmIcon className="pointer-events-none absolute -bottom-8 -left-8 size-32 sm:size-40 md:hidden text-brand-gold/10" />

        <div className="relative mx-auto grid max-w-6xl gap-8 sm:gap-10 md:gap-12 grid-cols-1 md:grid-cols-2 md:items-center">
          <Reveal>
            <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-lg shadow-xl">
              <Image
                src={heroImage}
                alt="DePalace palmwine, freshly tapped"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="md:pl-4 lg:pl-8">
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-brand-gold mb-3 sm:mb-4">
                Fresh, not processed
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-brand-cream/70 leading-relaxed">
                Our palmwine is tapped fresh and served the same day, no
                shortcuts, no long shelf life tricks. What you drink is as
                close to the source as it gets, the way it&apos;s meant to
                taste.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-brand-gold/80">
                  <span className="text-lg">🌴</span>
                  <span className="text-sm">Same-day tapping</span>
                </div>
                <div className="flex items-center gap-2 text-brand-gold/80">
                  <span className="text-lg">✨</span>
                  <span className="text-sm">No preservatives</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cooked Like Home Section */}
      <section className="bg-brand-cream px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <PalmDivider className="mb-4 sm:mb-6 text-brand-green" />
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-brand-green mb-4 sm:mb-6">
            Cooked like home
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-brand-charcoal/80 leading-relaxed max-w-2xl mx-auto">
            Asun, Bushmeat, Swallow, Proteins, and more. Every plate at DePalace is
            made the way you&apos;d find it at home, not dressed up for a
            restaurant menu. Good food is meant to be shared, so pull up a
            chair.
          </p>
        </Reveal>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-charcoal px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center text-brand-cream">
        <Reveal className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">
            Come as you are
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-brand-cream/70 leading-relaxed mb-6 sm:mb-8">
            No reservation, no dress code — just scan the QR on your table or
            check the menu online before you arrive.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/menu">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-brand-gold text-brand-charcoal shadow-lg shadow-brand-gold/20 transition-all hover:scale-105 hover:bg-brand-gold/90 text-sm sm:text-base px-6 py-5 sm:py-6"
              >
                See full menu
              </Button>
            </Link>
            <Link href="/">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 transition-all text-sm sm:text-base px-6 py-5 sm:py-6"
              >
                Back to home
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}