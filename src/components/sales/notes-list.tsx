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
  createdAt: Date;
  items: { itemId: string; itemName: string; unitPrice: string; quantity: number }[];
};

export function NotesList({ notes, stock }: { notes: Note[]; stock: StockItem[] }) {
  const [pending, startTransition] = useTransition();

  if (notes.length === 0) {
    return (
      <div className="px-4 py-8 sm:py-10 text-center">
        <p className="text-sm sm:text-base text-muted-foreground">
          No notes yet
        </p>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Jot down what a table ordered before recording the sale.
        </p>
      </div>
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
          <div key={note.id} className="space-y-3 sm:space-y-2 px-4 py-3 sm:py-4 text-sm">
            {/* Note Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-brand-green">
                  Table {note.tableNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="sm:hidden">
                    {note.createdAt.toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="hidden sm:inline">
                    {note.createdAt.toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <NoteFormModal
                  stock={stock}
                  note={note}
                  trigger={
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      className="flex-1 sm:flex-none"
                    >
                      Edit
                    </Button>
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  className="flex-1 sm:flex-none text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => startTransition(() => deleteSaleNote(note.id))}
                >
                  {pending ? "Removing..." : "Remove"}
                </Button>
              </div>
            </div>

            {/* Items List */}
            <ul className="space-y-1 text-muted-foreground">
              {note.items.map((item) => (
                <li 
                  key={item.itemId} 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-0"
                >
                  <span className="truncate">
                    <span className="font-medium text-foreground">
                      {item.quantity}×
                    </span>{" "}
                    {item.itemName}
                  </span>
                  <span className="sm:text-right">
                    {formatNaira(Number(item.unitPrice) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Note Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => setSaleNotePaid(note.id, !note.isPaid))}
                className={cn(
                  "self-start rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  note.isPaid
                    ? "border-brand-green/30 bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
                    : "border-yellow-600/30 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                )}
              >
                {note.isPaid ? "✓ Paid" : "Unpaid"}
              </button>
              <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                <span className="text-xs text-muted-foreground sm:hidden">
                  Total
                </span>
                <span className="font-medium text-brand-green">
                  {formatNaira(total)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}