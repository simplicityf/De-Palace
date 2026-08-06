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
    <div className="relative flex-1">
      <div className="fixed inset-0 z-0 overflow-hidden bg-brand-cream">
        <Image
          src={logoFull}
          alt=""
          fill
          className="object-contain object-center p-12 opacity-[0.06]"
          priority
        />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-sm tracking-[0.3em] text-brand-gold uppercase">
            Ilé Ému
          </p>
          <h1 className="font-serif text-4xl text-brand-green">Our Menu</h1>
        </div>

        {categoryList.length > 0 ? (
          <MenuBrowser categories={categoryList} />
        ) : (
          <p className="text-center text-muted-foreground">
            The menu is being updated. Please check back shortly.
          </p>
        )}
      </div>
    </div>
  );
}
