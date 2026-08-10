"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryFilter } from "@/components/category-filter";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/currency";

type StockItem = {
  id: string;
  name: string;
  price: string;
  quantity: number;
  categoryName: string;
};

function quantityClass(quantity: number) {
  if (quantity <= 0) return "text-muted-foreground";
  if (quantity <= 5) return "text-destructive";
  return "text-brand-green";
}

function quantityLabel(quantity: number) {
  return quantity > 0 ? `${quantity} left` : "Sold out";
}

export function StockBrowser({ items }: { items: StockItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.categoryName)))],
    [items],
  );

  const filtered = items.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || item.categoryName === category;
    return matchesQuery && matchesCategory;
  });

  const totalItems = filtered.length;
  const lowStockCount = filtered.filter((item) => item.quantity > 0 && item.quantity <= 5).length;
  const soldOutCount = filtered.filter((item) => item.quantity <= 0).length;

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Input
            placeholder="Search stock…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-white pr-8"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <CategoryFilter
          categories={categories}
          active={category}
          onSelect={setCategory}
          className="sm:min-w-0 sm:flex-1"
        />
      </div>

      {/* Stats Summary */}
      {(query || category !== "All") && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {totalItems} {totalItems === 1 ? "item" : "items"} found
          </span>
          {lowStockCount > 0 && (
            <span className="text-destructive">• {lowStockCount} low stock</span>
          )}
          {soldOutCount > 0 && (
            <span className="text-muted-foreground">• {soldOutCount} sold out</span>
          )}
        </div>
      )}

      {/* Desktop table - hidden on mobile */}
      <div className="hidden rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[120px]">Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {item.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.categoryName}
                </TableCell>
                <TableCell className="text-right">
                  {formatNaira(item.price)}
                </TableCell>
                <TableCell
                  className={cn("text-right font-medium", quantityClass(item.quantity))}
                >
                  {quantityLabel(item.quantity)}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No items match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards - visible only on mobile */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-brand-green/10 bg-white/90 py-8 text-center text-muted-foreground shadow-sm">
            <p className="text-sm">No items match your search.</p>
            {(query || category !== "All") && (
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
                className="mt-2 text-xs text-brand-green underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-brand-green/10 bg-white/90 p-4 shadow-sm backdrop-blur space-y-3 active:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium truncate">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.categoryName}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 text-sm font-medium",
                    quantityClass(item.quantity)
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      item.quantity <= 0
                        ? "bg-gray-400"
                        : item.quantity <= 5
                        ? "bg-destructive"
                        : "bg-brand-green"
                    )}
                  />
                  {quantityLabel(item.quantity)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-brand-green/10">
                <span className="text-xs text-muted-foreground">Price</span>
                <span className="font-medium text-sm">
                  {formatNaira(item.price)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}