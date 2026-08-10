"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemFormDialog } from "@/components/admin/item-form-dialog";
import { ArchiveItemButton } from "@/components/admin/archive-item-button";
import { updateItem } from "@/lib/actions/stock";
import { formatNaira } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: string;
  quantity: number;
};

export function StockTable({
  items,
  categories,
}: {
  items: Item[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categoryNames = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.categoryName)))],
    [items],
  );

  const filtered = items.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || item.categoryName === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-4 p-4">
      {/* Filters - Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
        <Input
          placeholder="Search stock…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-white w-[200px] md:w-full"
        />
        <div className="flex flex-wrap gap-2">
          {categoryNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors whitespace-nowrap",
                category === name
                  ? "border-brand-green bg-brand-green text-brand-cream"
                  : "border-brand-green/30 text-brand-green hover:bg-brand-green/10",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 sm:px-6">Name</TableHead>
              <TableHead className="px-4 sm:px-6">Category</TableHead>
              <TableHead className="text-right px-4 sm:px-6">Price</TableHead>
              <TableHead className="text-right px-4 sm:px-6">Quantity</TableHead>
              <TableHead className="text-right px-4 sm:px-6">Total value</TableHead>
              <TableHead className="text-right px-4 sm:px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium px-4 sm:px-6">{item.name}</TableCell>
                <TableCell className="text-muted-foreground px-4 sm:px-6">
                  {item.categoryName}
                </TableCell>
                <TableCell className="text-right px-4 sm:px-6">{formatNaira(item.price)}</TableCell>
                <TableCell className="text-right px-4 sm:px-6">
                  {item.quantity <= 5 ? (
                    <span className="font-medium text-destructive">
                      {item.quantity}
                    </span>
                  ) : (
                    item.quantity
                  )}
                </TableCell>
                <TableCell className="text-right px-4 sm:px-6">
                  {formatNaira(Number(item.price) * item.quantity)}
                </TableCell>
                <TableCell className="text-right px-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <ItemFormDialog
                      categories={categories}
                      action={updateItem.bind(null, item.id)}
                      item={item}
                      trigger={
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      }
                    />
                    <ArchiveItemButton id={item.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground px-4 sm:px-6">
                  No items match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards - Visible only on mobile */}
      <div className="md:hidden space-y-4 w-full">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur p-4 space-y-3 w-full overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm truncate">{item.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{item.categoryName}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ItemFormDialog
                  categories={categories}
                  action={updateItem.bind(null, item.id)}
                  item={item}
                  trigger={
                    <Button size="sm" variant="outline" className="text-xs">
                      Edit
                    </Button>
                  }
                />
                <ArchiveItemButton id={item.id} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="min-w-0">
                <span className="text-xs text-muted-foreground block">Price</span>
                <p className="font-medium truncate">{formatNaira(item.price)}</p>
              </div>
              <div className="min-w-0">
                <span className="text-xs text-muted-foreground block">Quantity</span>
                <p className={cn(
                  "font-medium truncate",
                  item.quantity <= 5 && "text-destructive"
                )}>
                  {item.quantity}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-brand-green/10 min-w-0">
              <span className="text-xs text-muted-foreground block">Total Value</span>
              <p className="font-semibold truncate">
                {formatNaira(Number(item.price) * item.quantity)}
              </p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-6 text-center text-muted-foreground bg-white/50 rounded-xl border border-brand-green/10">
            No items match.
          </div>
        )}
      </div>
    </div>
  );
}