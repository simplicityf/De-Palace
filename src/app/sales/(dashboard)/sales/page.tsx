import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  categories,
  items,
  saleNoteItems,
  saleNotes,
  sales,
  shifts,
} from "@/lib/db/schema";
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
import { NoteFormModal } from "@/components/sales/note-form-modal";
import { NotesList } from "@/components/sales/notes-list";
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
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl text-brand-green">Sales</h1>
          <p className="text-muted-foreground">Record sales during your shift.</p>
        </div>
        <div className="rounded-xl border border-brand-green/10 bg-white/90 p-10 text-center shadow-sm">
          <p className="text-brand-charcoal">
            You&apos;re not on a shift right now.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start your shift on the Dashboard before recording sales.
          </p>
          <Link href="/sales" className="mt-4 inline-block">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const [stock, recentSales, noteRows] = await Promise.all([
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
    db
      .select({
        id: saleNotes.id,
        tableNumber: saleNotes.tableNumber,
        isPaid: saleNotes.isPaid,
        itemId: saleNoteItems.itemId,
        itemName: saleNoteItems.itemName,
        quantity: saleNoteItems.quantity,
        unitPrice: saleNoteItems.unitPrice,
      })
      .from(saleNotes)
      .innerJoin(saleNoteItems, eq(saleNoteItems.noteId, saleNotes.id))
      .where(eq(saleNotes.shiftId, activeShift.id))
      .orderBy(desc(saleNotes.createdAt)),
  ]);

  const notesMap = new Map<
    string,
    {
      id: string;
      tableNumber: string;
      isPaid: boolean;
      items: { itemId: string; itemName: string; unitPrice: string; quantity: number }[];
    }
  >();
  for (const row of noteRows) {
    const existing = notesMap.get(row.id);
    const item = { itemId: row.itemId, itemName: row.itemName, unitPrice: row.unitPrice, quantity: row.quantity };
    if (existing) {
      existing.items.push(item);
    } else {
      notesMap.set(row.id, {
        id: row.id,
        tableNumber: row.tableNumber,
        isPaid: row.isPaid,
        items: [item],
      });
    }
  }
  const notes = Array.from(notesMap.values());

  const shiftTotal = recentSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-green">Sales</h1>
          <p className="text-muted-foreground">
            This shift so far — {formatNaira(shiftTotal)}. Looking for older
            sales? See{" "}
            <Link href="/sales/history" className="underline">
              Sales History
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <NoteFormModal
            shiftId={activeShift.id}
            stock={stock}
            trigger={<Button size="lg" variant="outline">Add note</Button>}
          />
          <RecordSaleModal
            shiftId={activeShift.id}
            items={stock}
            trigger={<Button size="lg">Record sale</Button>}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 font-serif text-lg text-brand-green">Recent sales</h2>
          <div className="rounded-lg border bg-white/90">
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
                      {sale.soldAt.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{sale.itemName}</TableCell>
                    <TableCell className="text-right">{sale.quantitySold}</TableCell>
                    <TableCell className="text-right">
                      {formatNaira(sale.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
                {recentSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No sales recorded yet this shift.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-lg text-brand-green">Notes</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            Jot down what a table ordered before recording the sale.
          </p>
          <div className="rounded-lg border bg-white/90">
            <NotesList shiftId={activeShift.id} notes={notes} stock={stock} />
          </div>
        </div>
      </div>
    </div>
  );
}
