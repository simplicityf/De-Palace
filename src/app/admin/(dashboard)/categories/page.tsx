import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { CategoryRow } from "@/components/admin/category-manager";

export default async function CategoriesPage() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      itemCount: sql<number>`count(${items.id})`.mapWith(Number),
    })
    .from(categories)
    .leftJoin(items, sql`${items.categoryId} = ${categories.id}`)
    .groupBy(categories.id)
    .orderBy(categories.name);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">
            Categories
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Organize stock into categories shown on the menu and sales screen.
          </p>
        </div>
        <CategoryFormDialog 
          trigger={<Button className="w-full sm:w-auto">Add category</Button>} 
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl border border-brand-green/10 bg-white/90 p-4 shadow-sm backdrop-blur overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Items</th>
              <th className="py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-muted-foreground">
                  No categories yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-brand-green/10 bg-white/90 p-6 shadow-sm backdrop-blur text-center text-muted-foreground">
            No categories yet. Add one above.
          </div>
        ) : (
          rows.map((category) => (
            <div
              key={category.id}
              className="rounded-xl border border-brand-green/10 bg-white/90 p-4 shadow-sm backdrop-blur"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <CategoryRow category={category} isMobile={true} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}