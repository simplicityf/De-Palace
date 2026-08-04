"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteSaleNote, setSaleNotePaid } from "@/lib/actions/sale-notes";
import { NoteFormModal } from "@/components/sales/note-form-modal";
import { formatNaira } from "@/lib/currency";

type StockItem = { id: string; name: string; price: string; quantity: number };

type Note = {
  id: string;
  tableNumber: string;
  isPaid: boolean;
  items: { itemId: string; itemName: string; unitPrice: string; quantity: number }[];
};

export function NotesList({
  shiftId,
  notes,
  stock,
}: {
  shiftId: string;
  notes: Note[];
  stock: StockItem[];
}) {
  const [pending, startTransition] = useTransition();

  if (notes.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-muted-foreground">
        No notes yet — jot down what a table ordered before recording the sale.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {notes.map((note) => {
        const total = note.items.reduce(
          (sum, i) => sum + Number(i.unitPrice) * i.quantity,
          0,
        );

        return (
          <div key={note.id} className="space-y-2 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">Table {note.tableNumber}</p>
              <div className="flex items-center gap-1">
                <NoteFormModal
                  shiftId={shiftId}
                  stock={stock}
                  note={note}
                  trigger={
                    <Button type="button" size="sm" variant="ghost">
                      Edit
                    </Button>
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  className="text-destructive hover:text-destructive"
                  onClick={() => startTransition(() => deleteSaleNote(shiftId, note.id))}
                >
                  Remove
                </Button>
              </div>
            </div>

            <ul className="space-y-0.5 text-muted-foreground">
              {note.items.map((item) => (
                <li key={item.itemId} className="flex items-center justify-between">
                  <span>
                    {item.quantity} × {item.itemName}
                  </span>
                  <span>{formatNaira(Number(item.unitPrice) * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(() => setSaleNotePaid(shiftId, note.id, !note.isPaid))
                }
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs transition-colors",
                  note.isPaid
                    ? "border-brand-green/30 bg-brand-green/10 text-brand-green"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
                )}
              >
                {note.isPaid ? "Paid" : "Not paid"}
              </button>
              <span className="font-medium text-brand-green">{formatNaira(total)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
