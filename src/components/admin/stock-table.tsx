"use client";

import { useMemo, useRef, useState, useEffect } from "react";
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
  costPrice: string | null;
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
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const categoryNames = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.categoryName)))],
    [items],
  );

  // Flags names that already appear more than once (e.g. added before the
  // duplicate check existed), so they can be cleaned up.
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = item.name.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return new Set([...counts].filter(([, n]) => n > 1).map(([key]) => key));
  }, [items]);
  const isDuplicate = (item: Item) => duplicateNames.has(item.name.trim().toLowerCase());

  const filtered = items.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || item.categoryName === category;
    return matchesQuery && matchesCategory;
  });

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 100);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Filters - Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
        <Input
          placeholder="Search stock…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-white w-full sm:w-[200px] md:w-[250px] flex-shrink-0"
        />
        
        {/* Category Carousel */}
        <div className="relative flex-1 min-w-0">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-brand-green/20 shadow-sm hover:bg-brand-green/5 transition-colors"
              aria-label="Scroll left"
            >
              <svg
                className="w-4 h-4 text-brand-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          
          {/* Carousel Container */}
          <div
            ref={carouselRef}
            onScroll={checkScroll}
            className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-1 -mx-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {categoryNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition-all flex-shrink-0 whitespace-nowrap hover:shadow-sm",
                  category === name
                    ? "border-brand-green bg-brand-green text-brand-cream shadow-sm"
                    : "border-brand-green/30 text-brand-green hover:bg-brand-green/10 hover:border-brand-green/50",
                )}
              >
                {name}
                {name !== "All" && (
                  <span className="ml-1.5 text-[10px] opacity-75">
                    {items.filter(i => i.categoryName === name).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-brand-green/20 shadow-sm hover:bg-brand-green/5 transition-colors"
              aria-label="Scroll right"
            >
              <svg
                className="w-4 h-4 text-brand-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Hidden scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 sm:px-6">Name</TableHead>
              <TableHead className="px-4 sm:px-6">Category</TableHead>
              <TableHead className="text-right px-4 sm:px-6">Price</TableHead>
              <TableHead className="text-right px-4 sm:px-6">Original price</TableHead>
              <TableHead className="text-right px-4 sm:px-6">Quantity</TableHead>
              <TableHead className="text-right px-4 sm:px-6">Total value</TableHead>
              <TableHead className="text-right px-4 sm:px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium px-4 sm:px-6 max-w-[200px] truncate">
                  {item.name}
                  {isDuplicate(item) && <DuplicateBadge />}
                </TableCell>
                <TableCell className="text-muted-foreground px-4 sm:px-6">
                  {item.categoryName}
                </TableCell>
                <TableCell className="text-right px-4 sm:px-6">
                  {formatNaira(item.price)}
                </TableCell>
                <TableCell className="text-right px-4 sm:px-6 text-muted-foreground">
                  {item.costPrice === null ? "—" : formatNaira(item.costPrice)}
                </TableCell>
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
                      existingItems={items}
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
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-muted-foreground px-4 sm:px-6"
                >
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
                <h3 className="font-medium text-sm truncate">
                  {item.name}
                  {isDuplicate(item) && <DuplicateBadge />}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {item.categoryName}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ItemFormDialog
                  categories={categories}
                  action={updateItem.bind(null, item.id)}
                  item={item}
                  existingItems={items}
                  trigger={
                    <Button size="sm" variant="outline" className="text-xs">
                      Edit
                    </Button>
                  }
                />
                <ArchiveItemButton id={item.id} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="min-w-0">
                <span className="text-xs text-muted-foreground block">Price</span>
                <p className="font-medium truncate">{formatNaira(item.price)}</p>
              </div>
              <div className="min-w-0">
                <span className="text-xs text-muted-foreground block">Original</span>
                <p className="font-medium truncate text-muted-foreground">
                  {item.costPrice === null ? "—" : formatNaira(item.costPrice)}
                </p>
              </div>
              <div className="min-w-0">
                <span className="text-xs text-muted-foreground block">Quantity</span>
                <p
                  className={cn(
                    "font-medium truncate",
                    item.quantity <= 5 && "text-destructive"
                  )}
                >
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

function DuplicateBadge() {
  return (
    <span
      title="Another product has the same name"
      className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 align-middle"
    >
      Duplicate
    </span>
  );
}
