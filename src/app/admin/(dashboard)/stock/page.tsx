import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { ItemFormDialog } from "@/components/admin/item-form-dialog";
import { StockTable } from "@/components/admin/stock-table";
import { createItem } from "@/lib/actions/stock";
import { formatNaira } from "@/lib/currency";

export default async function StockPage() {
  const [rows, categoryRows] = await Promise.all([
    db
      .select({
        id: items.id,
        name: items.name,
        price: items.price,
        quantity: items.quantity,
        categoryId: items.categoryId,
        categoryName: categories.name,
      })
      .from(items)
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.isArchived, false))
      .orderBy(categories.name, items.name),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name),
  ]);

  const grandTotal = rows.reduce(
    (sum, row) => sum + Number(row.price) * row.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-green">Stock</h1>
          <p className="text-muted-foreground">
            Total stock value: <span className="font-medium text-foreground">{formatNaira(grandTotal)}</span>
          </p>
        </div>
        {categoryRows.length > 0 ? (
          <ItemFormDialog
            categories={categoryRows}
            action={createItem}
            trigger={<Button>Add item</Button>}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Add a category first before adding items.
          </p>
        )}
      </div>

      <StockTable items={rows} categories={categoryRows} />
    </div>
  );
}
