import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items } from "@/lib/db/schema";
import { StockBrowser } from "@/components/sales/stock-browser";

export default async function SalesStockPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-brand-green">Stock</h1>
        <p className="text-muted-foreground">
          Search or filter to find an item quickly.
        </p>
      </div>
      <StockBrowser items={stock} />
    </div>
  );
}
