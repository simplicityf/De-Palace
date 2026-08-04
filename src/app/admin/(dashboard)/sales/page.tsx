import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sales, shifts, users } from "@/lib/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNaira } from "@/lib/currency";

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

  const activeShifts = await db
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
    .orderBy(shifts.startedAt);

  const combinedTotal = activeShifts.reduce((sum, shift) => sum + (shift.total ?? 0), 0);

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
        <div className="rounded-xl border border-brand-green/10 bg-white/90 px-6 py-4 text-right shadow-sm">
          <p className="text-sm text-muted-foreground">Combined total</p>
          <p className="font-serif text-2xl text-brand-green">
            {formatNaira(combinedTotal)}
          </p>
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
    </div>
  );
}
