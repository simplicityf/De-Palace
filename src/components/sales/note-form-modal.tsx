"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import {
  createSaleNote,
  updateSaleNote,
  type SaleNoteFormState,
} from "@/lib/actions/sale-notes";
import { formatNaira } from "@/lib/currency";

type StockItem = { id: string; name: string; price: string; quantity: number };
type ComboItem = { value: string; label: string };
type Line = { itemId: string; itemName: string; unitPrice: number; quantity: number };

type Note = {
  id: string;
  tableNumber: string;
  isPaid: boolean;
  items: { itemId: string; itemName: string; unitPrice: string; quantity: number }[];
};

export function NoteFormModal({
  shiftId,
  stock,
  note,
  trigger,
}: {
  shiftId: string;
  stock: StockItem[];
  note?: Note;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(note?.isPaid ?? false);
  const [lines, setLines] = useState<Line[]>(
    note?.items.map((i) => ({
      itemId: i.itemId,
      itemName: i.itemName,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
    })) ?? [],
  );
  const [selected, setSelected] = useState<ComboItem | null>(null);
  const [lineQuantity, setLineQuantity] = useState("1");
  const [lineError, setLineError] = useState<string | null>(null);

  const action = note ? updateSaleNote.bind(null, shiftId, note.id) : createSaleNote.bind(null, shiftId);

  function resetAll() {
    setOpen(false);
    setLines([]);
    setSelected(null);
    setLineQuantity("1");
    setLineError(null);
    setIsPaid(false);
  }

  const [state, formAction, pending] = useActionState<SaleNoteFormState, FormData>(
    async (prevState, formData) => {
      formData.set(
        "items",
        JSON.stringify(lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity }))),
      );
      const result = await action(prevState, formData);
      if (!result.error) resetAll();
      return result;
    },
    {},
  );

  const comboItems: ComboItem[] = stock
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      value: item.id,
      label: `${item.name} — ${formatNaira(item.price)} (${item.quantity} left)`,
    }));

  const selectedStockItem = stock.find((item) => item.id === selected?.value);

  function handleAddLine() {
    if (!selected || !selectedStockItem) {
      setLineError("Select an item.");
      return;
    }
    const qty = Number(lineQuantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setLineError("Enter a valid quantity.");
      return;
    }

    setLines((prev) => {
      const existing = prev.find((l) => l.itemId === selectedStockItem.id);
      if (existing) {
        return prev.map((l) =>
          l.itemId === selectedStockItem.id ? { ...l, quantity: l.quantity + qty } : l,
        );
      }
      return [
        ...prev,
        {
          itemId: selectedStockItem.id,
          itemName: selectedStockItem.name,
          unitPrice: Number(selectedStockItem.price),
          quantity: qty,
        },
      ];
    });
    setSelected(null);
    setLineQuantity("1");
    setLineError(null);
  }

  function removeLine(itemId: string) {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  }

  const grandTotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setLines(
            note?.items.map((i) => ({
              itemId: i.itemId,
              itemName: i.itemName,
              unitPrice: Number(i.unitPrice),
              quantity: i.quantity,
            })) ?? [],
          );
          setIsPaid(note?.isPaid ?? false);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{note ? "Edit note" : "Add a note"}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tableNumber">Table number</Label>
            <Input
              id="tableNumber"
              name="tableNumber"
              defaultValue={note?.tableNumber}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Items</Label>

            {lines.length > 0 && (
              <div className="divide-y rounded-md border">
                {lines.map((line) => (
                  <div
                    key={line.itemId}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span>
                      {line.quantity} × {line.itemName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {formatNaira(line.unitPrice * line.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(line.itemId)}
                        className="text-destructive hover:underline"
                        aria-label={`Remove ${line.itemName}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Combobox
                  items={comboItems}
                  value={selected}
                  onValueChange={(value) => setSelected(value as ComboItem | null)}
                >
                  <ComboboxInput placeholder="Search items…" className="w-full" />
                  <ComboboxContent>
                    <ComboboxList>
                      {(item: ComboItem) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                  </ComboboxContent>
                </Combobox>
              </div>
              <Input
                type="number"
                min="1"
                value={lineQuantity}
                onChange={(e) => setLineQuantity(e.target.value)}
                className="w-16"
              />
              <Button type="button" variant="outline" onClick={handleAddLine}>
                Add
              </Button>
            </div>
            {lineError && <p className="text-xs text-destructive">{lineError}</p>}
          </div>

          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="font-medium">Grand total</span>
            <span className="font-medium text-brand-green">{formatNaira(grandTotal)}</span>
          </div>

          <div className="space-y-2">
            <Label>Payment status</Label>
            <input type="hidden" name="isPaid" value={isPaid ? "paid" : "unpaid"} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                  !isPaid
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-input text-muted-foreground hover:bg-muted",
                )}
              >
                Not paid
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                  isPaid
                    ? "border-brand-green bg-brand-green/10 text-brand-green"
                    : "border-input text-muted-foreground hover:bg-muted",
                )}
              >
                Paid
              </button>
            </div>
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending || lines.length === 0}>
            {pending ? "Saving…" : note ? "Save changes" : "Add note"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
