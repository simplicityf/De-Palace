import Image from "next/image";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items } from "@/lib/db/schema";
import { MenuBrowser } from "@/components/public/menu-browser";
import logoFull from "../../../../public/images/logo-full.png";

export const revalidate = 0;

export default async function MenuPage() {
  const stock = await db
    .select({
      id: items.id,
      name: items.name,
      price: items.price,
      quantity: items.quantity,
      categoryName: categories.name,
    })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.isArchived, false))
    .orderBy(categories.name, items.name);

  const byCategory = stock.reduce<Record<string, typeof stock>>((acc, item) => {
    (acc[item.categoryName] ??= []).push(item);
    return acc;
  }, {});

  const categoryList = Object.entries(byCategory).map(([name, categoryItems]) => ({
    name,
    items: categoryItems,
  }));

  return (
    <div className="relative min-h-screen flex-1 bg-brand-cream">
      {/* Background watermark - visible on all screens */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src={logoFull}
          alt=""
          fill
          className="object-contain object-center p-8 sm:p-12 md:p-16 opacity-[0.04] sm:opacity-[0.05] md:opacity-[0.06]"
          priority
          sizes="100vw"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        {/* Header */}
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <p className="text-xs sm:text-sm tracking-[0.3em] text-brand-gold uppercase mb-2">
            Ilé Ému
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-brand-green">
            Our Menu
          </h1>
          {categoryList.length > 0 && (
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-brand-charcoal/60 max-w-md mx-auto">
              Tap a category to browse. Prices and availability are updated live.
            </p>
          )}
        </div>

        {/* Menu Content */}
        {categoryList.length > 0 ? (
          <div className="mx-auto max-w-2xl lg:max-w-4xl">
            <MenuBrowser categories={categoryList} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
            <div className="rounded-2xl border border-brand-green/10 bg-white/80 backdrop-blur-sm p-6 sm:p-8 md:p-10 text-center shadow-sm max-w-md mx-auto">
              <div className="mb-4 text-4xl sm:text-5xl">🍃</div>
              <p className="text-base sm:text-lg text-brand-charcoal/80 font-medium">
                The menu is being updated
              </p>
              <p className="mt-2 text-sm sm:text-base text-brand-charcoal/60">
                Please check back shortly. We&apos;re adding fresh items to make your experience even better.
              </p>
            </div>
          </div>
        )}

        {/* Footer note */}
        {categoryList.length > 0 && (
          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-xs sm:text-sm text-brand-charcoal/40">
              Prices are in local currency and may vary based on availability
            </p>
          </div>
        )}
      </div>
    </div>
  );
}