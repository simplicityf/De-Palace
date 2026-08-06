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
import { CategoryFilter } from "@/components/category-filter";
import { updateItem } from "@/lib/actions/stock";
import { formatNaira } from "@/lib/currency";

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search stock…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-white sm:max-w-xs"
        />
        <CategoryFilter
          categories={categoryNames}
          active={category}
          onSelect={setCategory}
          className="sm:min-w-0 sm:flex-1"
        />
      </div>

      <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Total value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.categoryName}
                </TableCell>
                <TableCell className="text-right">{formatNaira(item.price)}</TableCell>
                <TableCell className="text-right">
                  {item.quantity <= 5 ? (
                    <span className="font-medium text-destructive">
                      {item.quantity}
                    </span>
                  ) : (
                    item.quantity
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatNaira(Number(item.price) * item.quantity)}
                </TableCell>
                <TableCell className="text-right space-x-1">
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
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  No items match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
