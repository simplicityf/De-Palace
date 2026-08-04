import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { items, sales, shifts } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNaira } from "@/lib/currency";

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const conditions = [eq(shifts.salesAssistantId, userId)];
  if (from) conditions.push(gte(sales.soldAt, new Date(`${from}T00:00:00`)));
  if (to) {
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    conditions.push(lt(sales.soldAt, end));
  }

  const history = await db
    .select({
      id: sales.id,
      itemName: items.name,
      quantitySold: sales.quantitySold,
      totalAmount: sales.totalAmount,
      soldAt: sales.soldAt,
    })
    .from(sales)
    .innerJoin(items, eq(sales.itemId, items.id))
    .innerJoin(shifts, eq(sales.shiftId, shifts.id))
    .where(and(...conditions))
    .orderBy(desc(sales.soldAt));

  const total = history.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-green">Sales History</h1>
          <p className="text-muted-foreground">
            {history.length} sale{history.length === 1 ? "" : "s"}{" "}
            {(from || to) && "in this range"}
          </p>
        </div>
        <div className="rounded-xl border border-brand-green/10 bg-white/90 px-6 py-4 text-right shadow-sm">
          <p className="text-sm text-muted-foreground">Grand total</p>
          <p className="font-serif text-2xl text-brand-green">
            {formatNaira(total)}
          </p>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="from">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="h-9 rounded-md border bg-white px-3 text-sm"
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
            className="h-9 rounded-md border bg-white px-3 text-sm"
          />
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
        {(from || to) && (
          <Link href="/sales/history" className="text-sm text-muted-foreground underline">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded-lg border bg-white/90">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="text-muted-foreground">
                  {sale.soldAt.toLocaleString()}
                </TableCell>
                <TableCell>{sale.itemName}</TableCell>
                <TableCell className="text-right">{sale.quantitySold}</TableCell>
                <TableCell className="text-right">
                  {formatNaira(sale.totalAmount)}
                </TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No sales in this range.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {history.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Grand total
                </TableCell>
                <TableCell className="text-right font-medium text-brand-green">
                  {formatNaira(total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
