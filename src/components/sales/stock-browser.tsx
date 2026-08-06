"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search stock…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <CategoryFilter
          categories={categories}
          active={category}
          onSelect={setCategory}
          className="sm:min-w-0 sm:flex-1"
        />
      </div>

      <div className="divide-y rounded-lg border bg-white/90">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
          >
            <div>
              <p>{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.categoryName}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">{formatNaira(item.price)}</span>
              <span
                className={cn(
                  "font-medium",
                  item.quantity <= 0
                    ? "text-muted-foreground"
                    : item.quantity <= 5
                      ? "text-destructive"
                      : "text-brand-green",
                )}
              >
                {item.quantity > 0 ? `${item.quantity} left` : "Sold out"}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-muted-foreground">
            No items match your search.
          </p>
        )}
      </div>
    </div>
  );
}
