import Link from "next/link";
import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
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

export default async function CurrentSalesPage() {
  const totalsSubquery = db
    .select({
      shiftId: sales.shiftId,
      total: sql<number>`sum(${sales.totalAmount})`.mapWith(Number).as("total"),
      itemsSold: sql<number>`sum(${sales.quantitySold})`.mapWith(Number).as("items_sold"),
    })
    .from(sales)
    .groupBy(sales.shiftId)
    .as("totals");

  const { start: startOfDay, end: endOfDay } = businessDayBounds();

  const [activeShifts, stock, adminSalesToday] = await Promise.all([
    db
      .select({
        id: shifts.id,
        assistantName: users.name,
        startedAt: shifts.startedAt,
        total: totalsSubquery.total,
        itemsSold: totalsSubquery.itemsSold,
      })
      .from(shifts)
      .innerJoin(users, eq(shifts.salesAssistantId, users.id))
      .leftJoin(totalsSubquery, eq(totalsSubquery.shiftId, shifts.id))
      .where(eq(shifts.status, "active"))
      .orderBy(shifts.startedAt),
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
    db
      .select({
        id: sales.id,
        itemName: items.name,
        quantitySold: sales.quantitySold,
        totalAmount: sales.totalAmount,
        soldAt: sales.soldAt,
      })
      .from(sales)
      .innerJoin(items, eq(sales.itemId, items.id))
      .where(
        and(
          isNull(sales.shiftId),
          gte(sales.soldAt, startOfDay),
          lte(sales.soldAt, endOfDay),
        ),
      )
      .orderBy(desc(sales.soldAt)),
  ]);

  const shiftsTotal = activeShifts.reduce((sum, shift) => sum + (shift.total ?? 0), 0);
  const adminTotal = adminSalesToday.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const combinedTotal = shiftsTotal + adminTotal;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-green">Current Sales</h1>
          <p className="text-muted-foreground">
            Live view of shifts in progress right now.{" "}
            <Link href="/admin/sales/history" className="underline">
              See full history
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-brand-green/10 bg-white/90 px-6 py-4 text-right shadow-sm">
            <p className="text-sm text-muted-foreground">Combined total</p>
            <p className="font-serif text-2xl text-brand-green">
              {formatNaira(combinedTotal)}
            </p>
          </div>
          <AdminRecordSaleModal
            items={stock}
            trigger={<Button size="lg">Record sale</Button>}
          />
        </div>
      </div>

      <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead>Clocked in since</TableHead>
              <TableHead className="text-right">Items sold</TableHead>
              <TableHead className="text-right">Running total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeShifts.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell>
                  <Link href={`/admin/sales/${shift.id}`} className="hover:underline">
                    {shift.assistantName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {shift.startedAt.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{shift.itemsSold ?? 0}</TableCell>
                <TableCell className="text-right font-medium text-brand-green">
                  {formatNaira(shift.total ?? 0)}
                </TableCell>
              </TableRow>
            ))}
            {activeShifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No one is currently clocked in.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-lg text-brand-green">
          Recorded by you today
        </h2>
        <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminSalesToday.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-muted-foreground">
                    {sale.soldAt.toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{sale.itemName}</TableCell>
                  <TableCell className="text-right">{sale.quantitySold}</TableCell>
                  <TableCell className="text-right">
                    {formatNaira(sale.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
              {adminSalesToday.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No admin-recorded sales today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
