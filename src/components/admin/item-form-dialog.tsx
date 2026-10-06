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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemFormState } from "@/lib/actions/stock";
import { formatNaira } from "@/lib/currency";

type Category = { id: string; name: string };

type Item = {
  id: string;
  name: string;
  categoryId: string;
  price: string;
  costPrice: string | null;
  quantity: number;
};

type ExistingItem = { id: string; name: string };

export function ItemFormDialog({
  categories,
  action,
  item,
  existingItems = [],
  trigger,
}: {
  categories: Category[];
  existingItems?: ExistingItem[];
  action: (state: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  item?: Item;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [costPrice, setCostPrice] = useState(item?.costPrice ?? "");
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? "");
  const [state, formAction, pending] = useActionState<ItemFormState, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);
      if (!result.error) setOpen(false);
      return result;
    },
    {},
  );

  const total = (Number(price) || 0) * (Number(quantity) || 0);
  const marginPerUnit =
    costPrice !== "" && price !== "" ? Number(price) - Number(costPrice) : null;

  // Live hint only — the server action does the authoritative check.
  const normalizedName = name.trim().toLowerCase();
  const duplicate = normalizedName
    ? existingItems.find(
        (existing) =>
          existing.id !== item?.id &&
          existing.name.trim().toLowerCase() === normalizedName,
      )
    : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={duplicate ? true : undefined}
              required
            />
            {duplicate && (
              <p role="alert" className="text-sm text-amber-600">
                Product name &quot;{duplicate.name}&quot; already exists.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              name="categoryId"
              defaultValue={item?.categoryId}
              items={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            >
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costPrice">
              Original price (₦){" "}
              <span className="font-normal text-muted-foreground">— optional</span>
            </Label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="What you paid per unit"
              value={costPrice}
              onChange={(event) => setCostPrice(event.target.value)}
            />
            {marginPerUnit !== null && (
              <p
                className={
                  marginPerUnit < 0
                    ? "text-xs text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                Profit per unit: {formatNaira(marginPerUnit)}
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Total stock value: <span className="font-medium text-foreground">{formatNaira(total)}</span>
          </p>

          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending || Boolean(duplicate)}>
            {pending ? "Saving…" : item ? "Save changes" : "Add item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
