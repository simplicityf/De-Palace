import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, items, sales, shifts } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecordSaleModal } from "@/components/sales/record-sale-modal";
import { formatNaira } from "@/lib/currency";

export default async function SalesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [activeShift] = await db
    .select({ id: shifts.id, startedAt: shifts.startedAt })
    .from(shifts)
    .where(and(eq(shifts.salesAssistantId, userId), eq(shifts.status, "active")))
    .limit(1);

  if (!activeShift) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">
            Sales
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Record sales during your shift.
          </p>
        </div>
        <div className="rounded-xl border border-brand-green/10 bg-white/90 p-6 sm:p-10 text-center shadow-sm">
          <p className="text-brand-charcoal text-sm sm:text-base">
            You&apos;re not on a shift right now.
          </p>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Start your shift on the Dashboard before recording sales.
          </p>
          <Link href="/sales" className="mt-4 inline-block">
            <Button className="w-full sm:w-auto">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const [stock, recentSales] = await Promise.all([
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
      .where(eq(sales.shiftId, activeShift.id))
      .orderBy(desc(sales.soldAt)),
  ]);

  const shiftTotal = recentSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">
            Sales
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            This shift so far — {formatNaira(shiftTotal)}. Looking for older
            sales? See{" "}
            <Link href="/sales/history" className="underline">
              Sales History
            </Link>
            .
          </p>
        </div>
        <RecordSaleModal
          shiftId={activeShift.id}
          items={stock}
          trigger={
            <Button size="lg" className="w-full sm:w-auto">
              Record sale
            </Button>
          }
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <h2 className="mb-2 font-serif text-lg sm:text-xl text-brand-green">
          Recent sales
        </h2>
        <div className="rounded-lg border bg-white/90 overflow-x-auto">
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
              {recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-muted-foreground">
                    {sale.soldAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {sale.itemName}
                  </TableCell>
                  <TableCell className="text-right">
                    {sale.quantitySold}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNaira(sale.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
              {recentSales.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No sales recorded yet this shift.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-brand-green">Recent sales</h2>
          {recentSales.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {recentSales.length} {recentSales.length === 1 ? "sale" : "sales"}
            </span>
          )}
        </div>
        {recentSales.length === 0 ? (
          <div className="rounded-lg border bg-white/90 p-6 text-center text-muted-foreground">
            No sales recorded yet this shift.
          </div>
        ) : (
          <div className="space-y-2">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-lg border bg-white/90 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{sale.itemName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Qty: {sale.quantitySold}
                    </p>
                  </div>
                  <span className="font-medium text-brand-green whitespace-nowrap">
                    {formatNaira(sale.totalAmount)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {sale.soldAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}