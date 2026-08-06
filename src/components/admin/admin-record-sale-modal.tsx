"use client";

import { useState } from "react";
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
import { recordAdminSale } from "@/lib/actions/sales";
import { formatNaira } from "@/lib/currency";

type StockItem = { id: string; name: string; price: string; quantity: number };
type ComboItem = { value: string; label: string };

export function AdminRecordSaleModal({
  items,
  trigger,
}: {
  items: StockItem[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ComboItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const comboItems: ComboItem[] = items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      value: item.id,
      label: `${item.name} — ${formatNaira(item.price)} (${item.quantity} left)`,
    }));

  function reset() {
    setSelected(null);
    setQuantity("1");
    setError(null);
  }

  async function handleSubmit() {
    if (!selected) {
      setError("Select an item.");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Enter a valid quantity.");
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("itemId", selected.value);
    formData.set("quantity", quantity);

    const result = await recordAdminSale({}, formData);

    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a sale</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Item</Label>
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

          <div className="space-y-2">
            <Label htmlFor="admin-record-sale-quantity">Quantity</Label>
            <Input
              id="admin-record-sale-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button className="w-full" disabled={pending} onClick={handleSubmit}>
            {pending ? "Recording…" : "Proceed"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
