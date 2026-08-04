"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/currency";

type MenuItem = {
  id: string;
  name: string;
  price: string;
  quantity: number;
};

type Category = {
  name: string;
  items: MenuItem[];
};

export function MenuBrowser({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState<string>("All");

  const visible =
    active === "All" ? categories : categories.filter((c) => c.name === active);

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-6 mb-10 border-b border-brand-green/10 bg-brand-cream px-6 py-3 shadow-sm">
        <div className="flex flex-wrap justify-center gap-2">
          {["All", ...categories.map((c) => c.name)].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActive(name)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                active === name
                  ? "border-brand-green bg-brand-green text-brand-cream"
                  : "border-brand-green/30 text-brand-green hover:bg-brand-green/10",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {visible.map((category) => (
          <div key={category.name}>
            <h2 className="mb-4 border-b-2 border-brand-gold/40 pb-2 font-serif text-2xl text-brand-green">
              {category.name}
            </h2>
            <div className="space-y-3">
              {category.items.map((item) => (
                <div key={item.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-brand-charcoal">
                    {item.name}
                    {item.quantity <= 0 && (
                      <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">
                        Sold out
                      </span>
                    )}
                  </span>
                  <span className="flex-1 border-b border-dotted border-brand-charcoal/20" />
                  <span className="font-medium text-brand-green">
                    {formatNaira(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-center text-muted-foreground">
            Nothing in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}
