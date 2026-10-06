import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { ItemFormDialog } from "@/components/admin/item-form-dialog";
import { StockTable } from "@/components/admin/stock-table";
import { createItem } from "@/lib/actions/stock";
import { formatNaira } from "@/lib/currency";
import { 
  Package, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Layers,
  AlertCircle,
  ShoppingCart 
} from "lucide-react";

const LOW_STOCK_THRESHOLD = 5;

export default async function StockPage() {
  const [rows, categoryRows] = await Promise.all([
    db
      .select({
        id: items.id,
        name: items.name,
        price: items.price,
        costPrice: items.costPrice,
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

  const totalItems = rows.length;
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const lowStockCount = rows.filter(row => row.quantity <= LOW_STOCK_THRESHOLD).length;
  const averagePrice = totalItems > 0 ? grandTotal / totalQuantity : 0;

  const stats = [
    {
      label: "Total Items",
      value: totalItems,
      subtext: `${categoryRows.length} categories`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Stock Value",
      value: formatNaira(grandTotal),
      subtext: `${totalQuantity} units in stock`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Low Stock Alert",
      value: lowStockCount,
      subtext: `≤ ${LOW_STOCK_THRESHOLD} units threshold`,
      icon: AlertCircle,
      color: lowStockCount > 0 ? "text-amber-600" : "text-green-600",
      bgColor: lowStockCount > 0 ? "bg-amber-50" : "bg-green-50",
    },
    {
      label: "Avg. Unit Value",
      value: formatNaira(averagePrice),
      subtext: "Per unit average",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-3 px-4 py-3 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-brand-green flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green/70" />
            Stock Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your inventory, track stock levels, and update pricing
          </p>
        </div>
        {categoryRows.length > 0 ? (
          <ItemFormDialog
            categories={categoryRows}
            action={createItem}
            existingItems={rows}
            trigger={
              <Button className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow">
                <Plus className="w-4 h-4 mr-2" />
                Add item
              </Button>
            }
          />
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>Add a category first before adding items.</p>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-brand-green/10 bg-white/90 p-4 sm:p-5 shadow-sm backdrop-blur hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {stat.label}
                  </p>
                  <p className="font-serif text-lg sm:text-xl md:text-2xl text-brand-green truncate">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate">
                    {stat.subtext}
                  </p>
                </div>
                <div className={`p-2 sm:p-2.5 rounded-lg ${stat.bgColor} flex-shrink-0 ml-2`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Table */}
      <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-brand-green/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-serif text-base sm:text-lg text-brand-green flex items-center gap-2">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green/70" />
                Inventory List
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Showing {totalItems} items across {categoryRows.length} categories
              </p>
            </div>
            {totalItems > 0 && (
              <div className="text-xs sm:text-sm text-muted-foreground bg-brand-cream/50 rounded-lg px-3 py-1.5">
                Total value: <span className="font-medium text-brand-green">{formatNaira(grandTotal)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* StockTable handles its own responsive layout (table on md+, cards
            below) — no outer min-width wrapper needed, and forcing one here
            was exactly what caused mobile to overflow horizontally. */}
        <StockTable items={rows} categories={categoryRows} />

        {rows.length === 0 && (
          <div className="px-4 py-12 sm:py-16 text-center">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-base sm:text-lg text-muted-foreground font-medium">
              No items in stock
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-md mx-auto">
              Start by adding your first item to the inventory. Make sure you have at least one category created first.
            </p>
            {categoryRows.length > 0 && (
              <div className="mt-6">
                <ItemFormDialog
                  categories={categoryRows}
                  action={createItem}
            existingItems={rows}
                  trigger={
                    <Button variant="outline" size="lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Add your first item
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      {rows.length > 0 && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="text-center p-3 rounded-lg bg-white/50 border border-brand-green/10">
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="font-medium text-brand-green mt-1">{categoryRows.length}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/50 border border-brand-green/10">
            <p className="text-xs text-muted-foreground">Total Units</p>
            <p className="font-medium text-brand-green mt-1">{totalQuantity}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/50 border border-brand-green/10">
            <p className="text-xs text-muted-foreground">Low Stock</p>
            <p className={`font-medium mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {lowStockCount}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/50 border border-brand-green/10">
            <p className="text-xs text-muted-foreground">Avg. Price</p>
            <p className="font-medium text-brand-green mt-1">{formatNaira(averagePrice)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/50 border border-brand-green/10">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="font-medium text-brand-green mt-1">{formatNaira(grandTotal)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/50 border border-brand-green/10">
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="font-medium text-brand-green mt-1 text-xs">Today</p>
          </div>
        </div>
      )}
    </div>
  );
}