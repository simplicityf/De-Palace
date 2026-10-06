import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items, sales, shifts } from "@/lib/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExcludeFilter } from "@/components/admin/exclude-filter";
import { StatCard } from "@/components/admin/stat-card";
import { formatNaira } from "@/lib/currency";
import { businessMonthRange } from "@/lib/date-range";
import {
  getExcludeOptions,
  getSalesSummary,
  parseSalesFilters,
  profitSql,
  salesFiltersToParams,
  salesWhere,
  type SalesFilters,
  uncostedCountSql,
  unitCostSql,
} from "@/lib/reports/sales-filters";
import { AlertCircle, Percent, TrendingUp, Wallet } from "lucide-react";

function monthHref(offset: number, filters: SalesFilters) {
  const params = salesFiltersToParams({ ...filters, ...businessMonthRange(offset) });
  return `/admin/revenue?${params.toString()}`;
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseSalesFilters(await searchParams);
  const thisMonth = businessMonthRange(0);
  const previousMonth = businessMonthRange(-1);

  const [excludeGroups, summary, byItem] = await Promise.all([
    getExcludeOptions(),
    getSalesSummary(filters),
    db
      .select({
        itemId: items.id,
        itemName: items.name,
        categoryName: categories.name,
        unitsSold: sql<number>`coalesce(sum(${sales.quantitySold}), 0)::int`,
        salesTotal: sql<string>`coalesce(sum(${sales.totalAmount}), 0)`,
        cost: sql<string>`coalesce(sum(${unitCostSql} * ${sales.quantitySold}), 0)`,
        profit: profitSql,
        uncostedCount: uncostedCountSql,
      })
      .from(sales)
      .innerJoin(items, eq(sales.itemId, items.id))
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .leftJoin(shifts, eq(sales.shiftId, shifts.id))
      .where(salesWhere(filters))
      .groupBy(items.id, items.name, categories.name)
      .orderBy(desc(profitSql), items.name),
  ]);

  const activePreset =
    filters.from === thisMonth.from && filters.to === thisMonth.to
      ? "this"
      : filters.from === previousMonth.from && filters.to === previousMonth.to
        ? "previous"
        : null;

  const stats = [
    {
      label: "Revenue (profit)",
      value: formatNaira(summary.profit),
      subtext: "Selling price − original price",
      icon: TrendingUp,
      color: summary.profit < 0 ? "text-destructive" : "text-purple-600",
      bgColor: summary.profit < 0 ? "bg-red-50" : "bg-purple-50",
    },
    {
      label: "Sales value",
      value: formatNaira(summary.salesTotal),
      subtext: `${summary.count} sales · ${summary.unitsSold} units`,
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Profit margin",
      value: summary.margin === null ? "—" : `${(summary.margin * 100).toFixed(1)}%`,
      subtext: "Of sales with an original price",
      icon: Percent,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Not counted",
      value: summary.uncostedCount,
      subtext: "Sales with no original price",
      icon: AlertCircle,
      color: summary.uncostedCount > 0 ? "text-amber-600" : "text-green-600",
      bgColor: summary.uncostedCount > 0 ? "bg-amber-50" : "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">Revenue</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Total profit from sales: (selling price − original price) × quantity.
          Set an item&apos;s original price on the{" "}
          <Link href="/admin/stock" className="underline">
            Stock page
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <form className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3" method="get">
        <div className="flex flex-col sm:flex-row gap-3 sm:flex-1 sm:flex-wrap">
          <div className="space-y-1">
            <span className="text-sm font-medium">Period</span>
            <div className="flex gap-2">
              <Link href={monthHref(0, filters)}>
                <Button type="button" size="sm" variant={activePreset === "this" ? "default" : "outline"} className="h-9">
                  This month
                </Button>
              </Link>
              <Link href={monthHref(-1, filters)}>
                <Button type="button" size="sm" variant={activePreset === "previous" ? "default" : "outline"} className="h-9">
                  Previous month
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 sm:flex-none">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="from">From</label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={filters.from}
                className="h-9 w-full rounded-md border bg-white px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="to">To</label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={filters.to}
                className="h-9 w-full rounded-md border bg-white px-3 text-sm"
              />
            </div>
          </div>
          <ExcludeFilter
            groups={excludeGroups}
            excludeItems={filters.excludeItems}
            excludeCategories={filters.excludeCategories}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="outline" className="flex-1 sm:flex-none">
            Filter
          </Button>
          <Link href="/admin/revenue" className="text-sm text-muted-foreground underline whitespace-nowrap">
            Reset
          </Link>
        </div>
      </form>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Sales value</TableHead>
              <TableHead className="text-right">Original cost</TableHead>
              <TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byItem.map((row) => (
              <TableRow key={row.itemId}>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {row.itemName}
                  {row.uncostedCount > 0 && (
                    <span
                      title={`${row.uncostedCount} sales had no original price and aren't counted in profit`}
                      className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 align-middle"
                    >
                      {row.uncostedCount} not counted
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{row.categoryName}</TableCell>
                <TableCell className="text-right">{row.unitsSold}</TableCell>
                <TableCell className="text-right">{formatNaira(row.salesTotal)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatNaira(row.cost)}</TableCell>
                <TableCell
                  className={`text-right font-medium ${Number(row.profit) < 0 ? "text-destructive" : "text-brand-green"}`}
                >
                  {formatNaira(row.profit)}
                </TableCell>
              </TableRow>
            ))}
            {byItem.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No sales in this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {byItem.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="font-medium">Total revenue</TableCell>
                <TableCell className="text-right font-medium text-brand-green">
                  {formatNaira(summary.profit)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {byItem.length === 0 ? (
          <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur p-6 text-center text-muted-foreground">
            No sales in this period.
          </div>
        ) : (
          <>
            {byItem.map((row) => (
              <div
                key={row.itemId}
                className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{row.itemName}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {row.categoryName} · {row.unitsSold} units
                    </p>
                  </div>
                  <span
                    className={`font-medium flex-shrink-0 ${Number(row.profit) < 0 ? "text-destructive" : "text-brand-green"}`}
                  >
                    {formatNaira(row.profit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sales {formatNaira(row.salesTotal)}</span>
                  <span>Cost {formatNaira(row.cost)}</span>
                </div>
                {row.uncostedCount > 0 && (
                  <p className="text-xs text-amber-700">
                    {row.uncostedCount} sales not counted (no original price)
                  </p>
                )}
              </div>
            ))}
            <div className="rounded-xl border border-brand-green/10 bg-brand-green/5 p-4 flex items-center justify-between">
              <span className="font-medium">Total revenue</span>
              <span className="font-serif text-lg font-medium text-brand-green">
                {formatNaira(summary.profit)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
