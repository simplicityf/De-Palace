import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { items, sales, shifts, users } from "@/lib/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DeleteSaleButton } from "@/components/admin/delete-sale-button";
import { ExcludeFilter } from "@/components/admin/exclude-filter";
import { Pagination } from "@/components/admin/pagination";
import { StatCard } from "@/components/admin/stat-card";
import { formatNaira } from "@/lib/currency";
import {
  getExcludeOptions,
  getSalesSummary,
  parseSalesFilters,
  salesFiltersToParams,
  salesWhere,
} from "@/lib/reports/sales-filters";
import { Package, Receipt, TrendingUp, Wallet } from "lucide-react";

const recordedByUser = alias(users, "recorded_by_user");

const PAGE_SIZE = 25;

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const filters = parseSalesFilters(raw);
  const requestedPage = Number(Array.isArray(raw.page) ? raw.page[0] : raw.page);

  const [assistants, excludeGroups, summary] = await Promise.all([
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.role, "sales"))
      .orderBy(users.name),
    getExcludeOptions(),
    getSalesSummary(filters),
  ]);

  const totalPages = Math.max(1, Math.ceil(summary.count / PAGE_SIZE));
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1;

  const rawRows = await db
    .select({
      id: sales.id,
      soldAt: sales.soldAt,
      shiftAssistantName: users.name,
      recordedByName: recordedByUser.name,
      itemName: items.name,
      quantitySold: sales.quantitySold,
      totalAmount: sales.totalAmount,
    })
    .from(sales)
    .innerJoin(items, eq(sales.itemId, items.id))
    .leftJoin(shifts, eq(sales.shiftId, shifts.id))
    .leftJoin(users, eq(shifts.salesAssistantId, users.id))
    .leftJoin(recordedByUser, eq(sales.recordedByUserId, recordedByUser.id))
    .where(salesWhere(filters))
    .orderBy(desc(sales.soldAt), desc(sales.id))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const rows = rawRows.map((row) => ({
    ...row,
    staffLabel: row.shiftAssistantName ?? (row.recordedByName ? `${row.recordedByName} (Admin)` : "Admin"),
    deleteDescription: `${row.quantitySold} × ${row.itemName} (${formatNaira(row.totalAmount)}) on ${row.soldAt.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
  }));

  const filterParams = salesFiltersToParams(filters);
  const isFiltered =
    Boolean(filters.staff) ||
    filters.excludeItems.length > 0 ||
    filters.excludeCategories.length > 0 ||
    "from" in raw ||
    "to" in raw;

  const periodLabel =
    filters.from && filters.to
      ? `${filters.from} → ${filters.to}`
      : filters.from
        ? `Since ${filters.from}`
        : filters.to
          ? `Up to ${filters.to}`
          : "All time";

  const stats = [
    {
      label: "Total sales",
      value: formatNaira(summary.salesTotal),
      subtext: periodLabel,
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Revenue (profit)",
      value: formatNaira(summary.profit),
      subtext:
        summary.uncostedCount > 0
          ? `${summary.uncostedCount} sales without original price`
          : summary.margin !== null
            ? `${(summary.margin * 100).toFixed(1)}% margin`
            : "No sales yet",
      icon: TrendingUp,
      color: summary.profit < 0 ? "text-destructive" : "text-purple-600",
      bgColor: summary.profit < 0 ? "bg-red-50" : "bg-purple-50",
    },
    {
      label: "Transactions",
      value: summary.count,
      subtext: "Sales recorded",
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Units sold",
      value: summary.unitsSold,
      subtext: "Across all items",
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">
          Sales History
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Every sale recorded across all staff — this month by default.{" "}
          <Link href="/admin/sales" className="underline">
            View current sales
          </Link>
          .
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Filter Form */}
      <form className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3" method="get">
        <div className="flex flex-col sm:flex-row gap-3 sm:flex-1 sm:flex-wrap">
          <div className="space-y-1 flex-1 sm:flex-none">
            <label className="text-sm font-medium">Staff</label>
            <Select
              name="staff"
              defaultValue={filters.staff}
              items={assistants.map((a) => ({ value: a.id, label: a.name }))}
            >
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="All staff" />
              </SelectTrigger>
              <SelectContent>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 sm:flex-none">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="from">
                From
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={filters.from}
                className="h-9 w-full rounded-md border bg-white px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="to">
                To
              </label>
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
          {isFiltered && (
            <Link
              href="/admin/sales/history"
              className="text-sm text-muted-foreground underline whitespace-nowrap"
            >
              Clear
            </Link>
          )}
          <a
            href={`/admin/sales/history/export?${filterParams.toString()}`}
            className="sm:ml-auto"
          >
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Export CSV
            </Button>
          </a>
        </div>
      </form>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {row.soldAt.toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {row.staffLabel}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {row.itemName}
                </TableCell>
                <TableCell className="text-right">{row.quantitySold}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatNaira(row.totalAmount)}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteSaleButton id={row.id} description={row.deleteDescription} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No sales found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-medium">
                  Grand total{totalPages > 1 ? " (all pages)" : ""}
                </TableCell>
                <TableCell className="text-right font-medium text-brand-green">
                  {formatNaira(summary.salesTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur p-6 text-center text-muted-foreground">
            No sales found.
          </div>
        ) : (
          <>
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{row.itemName}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {row.staffLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {row.soldAt.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <DeleteSaleButton id={row.id} description={row.deleteDescription} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="space-x-4">
                    <span className="text-muted-foreground">
                      Qty: {row.quantitySold}
                    </span>
                    <span className="text-muted-foreground">
                      {row.soldAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span className="font-medium text-brand-green">
                    {formatNaira(row.totalAmount)}
                  </span>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-brand-green/10 bg-brand-green/5 p-4 flex items-center justify-between">
              <span className="font-medium">
                Grand total{totalPages > 1 ? " (all pages)" : ""}
              </span>
              <span className="font-serif text-lg font-medium text-brand-green">
                {formatNaira(summary.salesTotal)}
              </span>
            </div>
          </>
        )}
      </div>

      <Pagination
        pathname="/admin/sales/history"
        params={filterParams}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
