import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { items, sales, shifts, users } from "@/lib/db/schema";

const recordedByUser = alias(users, "recorded_by_user");
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
import { formatNaira } from "@/lib/currency";

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ staff?: string; from?: string; to?: string }>;
}) {
  const { staff: staffFilter, from, to } = await searchParams;

  const assistants = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "sales"))
    .orderBy(users.name);

  const conditions = [];
  if (staffFilter) conditions.push(eq(shifts.salesAssistantId, staffFilter));
  if (from) conditions.push(gte(sales.soldAt, new Date(`${from}T00:00:00`)));
  if (to) {
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    conditions.push(lt(sales.soldAt, end));
  }

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(sales.soldAt));

  const rows = rawRows.map((row) => ({
    ...row,
    staffLabel: row.shiftAssistantName ?? (row.recordedByName ? `${row.recordedByName} (Admin)` : "Admin"),
  }));

  const grandTotal = rows.reduce((sum, row) => sum + Number(row.totalAmount), 0);

  const exportParams = new URLSearchParams();
  if (staffFilter) exportParams.set("staff", staffFilter);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">
            Sales History
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Every sale recorded across all staff.{" "}
            <Link href="/admin/sales" className="underline">
              View current sales
            </Link>
            .
          </p>
        </div>
        <div className="rounded-xl border border-brand-green/10 bg-white/90 px-4 sm:px-6 py-3 sm:py-4 text-center sm:text-right shadow-sm">
          <p className="text-xs sm:text-sm text-muted-foreground">Grand total</p>
          <p className="font-serif text-xl sm:text-2xl text-brand-green">
            {formatNaira(grandTotal)}
          </p>
        </div>
      </div>

      {/* Filter Form */}
      <form className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3" method="get">
        <div className="flex flex-col sm:flex-row gap-3 sm:flex-1">
          <div className="space-y-1 flex-1 sm:flex-none">
            <label className="text-sm font-medium">Staff</label>
            <Select
              name="staff"
              defaultValue={staffFilter}
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
                defaultValue={from}
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
                defaultValue={to}
                className="h-9 w-full rounded-md border bg-white px-3 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="outline" className="flex-1 sm:flex-none">
            Filter
          </Button>
          {(staffFilter || from || to) && (
            <Link
              href="/admin/sales/history"
              className="text-sm text-muted-foreground underline whitespace-nowrap"
            >
              Clear
            </Link>
          )}
          <a
            href={`/admin/sales/history/export?${exportParams.toString()}`}
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
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No sales found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-medium">
                  Grand total
                </TableCell>
                <TableCell className="text-right font-medium text-brand-green">
                  {formatNaira(grandTotal)}
                </TableCell>
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
                  <span className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {row.soldAt.toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
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
            {rows.length > 0 && (
              <div className="rounded-xl border border-brand-green/10 bg-brand-green/5 p-4 flex items-center justify-between">
                <span className="font-medium">Grand total</span>
                <span className="font-serif text-lg font-medium text-brand-green">
                  {formatNaira(grandTotal)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}