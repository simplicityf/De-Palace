import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, items, saleNoteItems, saleNotes, shifts } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { NoteFormModal } from "@/components/sales/note-form-modal";
import { NotesList } from "@/components/sales/notes-list";

export default async function NotesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [activeShift, stock, noteRows] = await Promise.all([
    db
      .select({ id: shifts.id })
      .from(shifts)
      .where(and(eq(shifts.salesAssistantId, userId), eq(shifts.status, "active")))
      .limit(1)
      .then((rows) => rows[0] ?? null),
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
    // Notes from every shift this assistant has ever worked, not just the
    // active one — they stick around for future reference until deleted.
    db
      .select({
        id: saleNotes.id,
        tableNumber: saleNotes.tableNumber,
        isPaid: saleNotes.isPaid,
        createdAt: saleNotes.createdAt,
        itemId: saleNoteItems.itemId,
        itemName: saleNoteItems.itemName,
        quantity: saleNoteItems.quantity,
        unitPrice: saleNoteItems.unitPrice,
      })
      .from(saleNotes)
      .innerJoin(saleNoteItems, eq(saleNoteItems.noteId, saleNotes.id))
      .innerJoin(shifts, eq(saleNotes.shiftId, shifts.id))
      .where(eq(shifts.salesAssistantId, userId))
      .orderBy(desc(saleNotes.createdAt)),
  ]);

  const notesMap = new Map<
    string,
    {
      id: string;
      tableNumber: string;
      isPaid: boolean;
      createdAt: Date;
      items: { itemId: string; itemName: string; unitPrice: string; quantity: number }[];
    }
  >();
  for (const row of noteRows) {
    const existing = notesMap.get(row.id);
    const item = {
      itemId: row.itemId,
      itemName: row.itemName,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
    };
    if (existing) {
      existing.items.push(item);
    } else {
      notesMap.set(row.id, {
        id: row.id,
        tableNumber: row.tableNumber,
        isPaid: row.isPaid,
        createdAt: row.createdAt,
        items: [item],
      });
    }
  }
  const notes = Array.from(notesMap.values());

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">
            Notes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Jot down what a table ordered before recording the sale. Notes
            stay here for reference until you delete them.
          </p>
        </div>
        {activeShift ? (
          <NoteFormModal
            shiftId={activeShift.id}
            stock={stock}
            trigger={
              <Button size="lg" className="w-full sm:w-auto">
                Add note
              </Button>
            }
          />
        ) : (
          <Button
            size="lg"
            disabled
            className="w-full sm:w-auto"
            title="Start your shift to add a note"
          >
            Add note
          </Button>
        )}
      </div>

      {/* Notes List Container */}
      <div className="rounded-lg border bg-white/90 overflow-hidden">
        <NotesList notes={notes} stock={stock} />
      </div>
    </div>
  );
}