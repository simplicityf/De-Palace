"use client";

import { cn } from "@/lib/utils";

export function CategoryFilter({
  categories,
  active,
  onSelect,
  className,
}: {
  categories: string[];
  active: string;
  onSelect: (name: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {categories.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelect(name)}
          className={cn(
            "shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
            active === name
              ? "border-brand-green bg-brand-green text-brand-cream"
              : "border-brand-green/30 text-brand-green hover:bg-brand-green/10",
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
