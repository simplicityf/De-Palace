import Link from "next/link";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { categories, items, sales, shifts, users } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminRecordSaleModal } from "@/components/admin/admin-record-sale-modal";
import { formatNaira } from "@/lib/currency";
import { businessDayBounds } from "@/lib/date-range";

const recordedByUser = alias(users, "recorded_by_user");

export default async function CurrentSalesPage() {
  const { start: startOfDay, end: endOfDay } = businessDayBounds();

  const [todaySales, stock] = await Promise.all([
    db
      .select({
        id: sales.id,
        soldAt: sales.soldAt,
        itemName: items.name,
        quantitySold: sales.quantitySold,
        unitPriceAtSale: sales.unitPriceAtSale,
        totalAmount: sales.totalAmount,
        shiftAssistantName: users.name,
        recordedByName: recordedByUser.name,
      })
      .from(sales)
      .innerJoin(items, eq(sales.itemId, items.id))
      .leftJoin(shifts, eq(sales.shiftId, shifts.id))
      .leftJoin(users, eq(shifts.salesAssistantId, users.id))
      .leftJoin(recordedByUser, eq(sales.recordedByUserId, recordedByUser.id))
      .where(and(gte(sales.soldAt, startOfDay), lte(sales.soldAt, endOfDay)))
      .orderBy(desc(sales.soldAt)),
    db
      .select({
        id: items.id,
        name: items.name,
        price: items.price,
        quantity: items.quantity,
      })
      .from(items)
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.isArchived, false))
      .orderBy(categories.name, items.name),
  ]);

  const rows = todaySales.map((row) => ({
    ...row,
    staffLabel:
      row.shiftAssistantName ??
      (row.recordedByName ? `${row.recordedByName} (Admin)` : "Admin"),
  }));

  const combinedTotal = rows.reduce((sum, row) => sum + Number(row.totalAmount), 0);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">
            Current Sales
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Every sale recorded today.{" "}
            <Link href="/admin/sales/history" className="underline">
              See full history
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="rounded-xl border border-brand-green/10 bg-white/90 px-4 sm:px-6 py-3 sm:py-4 text-center sm:text-right shadow-sm">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Today&apos;s total
            </p>
            <p className="font-serif text-xl sm:text-2xl text-brand-green">
              {formatNaira(combinedTotal)}
            </p>
          </div>
          <AdminRecordSaleModal
            items={stock}
            trigger={
              <Button size="lg" className="w-full sm:w-auto">
                Record sale
              </Button>
            }
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground">
                  {row.soldAt.toLocaleTimeString([], {
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
                <TableCell className="text-right text-muted-foreground">
                  {formatNaira(row.unitPriceAtSale)}
                </TableCell>
                <TableCell className="text-right font-medium text-brand-green">
                  {formatNaira(row.totalAmount)}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No sales recorded today yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur p-6 text-center text-muted-foreground">
            No sales recorded today yet.
          </div>
        ) : (
          rows.map((row) => (
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
                <span className="text-sm text-muted-foreground flex-shrink-0">
                  {row.soldAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="space-x-4">
                  <span className="text-muted-foreground">
                    Qty: {row.quantitySold}
                  </span>
                  <span className="text-muted-foreground">
                    @ {formatNaira(row.unitPriceAtSale)}
                  </span>
                </div>
                <span className="font-medium text-brand-green">
                  {formatNaira(row.totalAmount)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}