import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/public/reveal";
import { PalmDivider, PalmIcon } from "@/components/public/palm-icon";
import heroImage from "../../../../public/images/hero.jpg";
import storyImage from "../../../../public/images/story.jpg";

export default function AboutPage() {
  return (
    <div>
      <section className="relative flex min-h-[45vh] flex-col items-center justify-center overflow-hidden px-6 text-center text-brand-cream">
        <Image src={storyImage} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-brand-charcoal/70" />
        <div className="relative">
          <p className="text-sm tracking-[0.35em] text-brand-gold uppercase">
            Our story
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">About DePalace</h1>
        </div>
      </section>

      <section className="bg-brand-cream px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <PalmDivider className="mb-4 text-brand-gold" />
          <h2 className="font-serif text-3xl text-brand-green">
            Ilé Ému - a house of wine
          </h2>
          <p className="mt-4 text-brand-charcoal/80">
            In Yoruba, &ldquo;Ilé Ému&rdquo; means house of wine. That&apos;s
            what DePalace has always been a place under the palms to slow
            down, share a calabash with people you like, and enjoy palmwine
            the way it&apos;s always been done, long before it had a fancy
            label on it.
          </p>
        </Reveal>
      </section>

      <section className="relative overflow-hidden bg-brand-charcoal px-6 py-20 text-brand-cream">
        <PalmIcon className="pointer-events-none absolute -right-10 top-10 size-56 text-brand-gold/10" />

        <div className="relative mx-auto grid max-w-4xl gap-10 sm:grid-cols-2 sm:items-center">
          <Reveal>
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-xl">
              <Image
                src={heroImage}
                alt="DePalace palmwine, freshly tapped"
                fill
                className="object-cover"
                sizes="(min-width: 640px) 50vw, 100vw"
              />
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <h2 className="font-serif text-2xl text-brand-gold">
              Fresh, not processed
            </h2>
            <p className="mt-4 text-brand-cream/70">
              Our palmwine is tapped fresh and served the same day, no
              shortcuts, no long shelf life tricks. What you drink is as
              close to the source as it gets, the way it&apos;s meant to
              taste.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-brand-cream px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <PalmDivider className="mb-4 text-brand-green" />
          <h2 className="font-serif text-3xl text-brand-green">
            Cooked like home
          </h2>
          <p className="mt-4 text-brand-charcoal/80">
            Asun, Bushmeat, Sallow, Proteins, and more. Every plate at DePalace is
            made the way you&apos;d find it at home, not dressed up for a
            restaurant menu. Good food is meant to be shared, so pull up a
            chair.
          </p>
        </Reveal>
      </section>

      <section className="bg-brand-charcoal px-6 py-20 text-center text-brand-cream">
        <Reveal className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl">Come as you are</h2>
          <p className="mt-3 text-brand-cream/70">
            No reservation, no dress code, just scan the QR on your table or
            check the menu online before you arrive.
          </p>
          <Link href="/menu" className="mt-6 inline-block">
            <Button
              size="lg"
              className="bg-brand-gold text-brand-charcoal shadow-lg shadow-brand-gold/20 transition-transform hover:scale-105 hover:bg-brand-gold/90"
            >
              See full menu
            </Button>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
