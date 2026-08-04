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
  quantity: number;
};

export function ItemFormDialog({
  categories,
  action,
  item,
  trigger,
}: {
  categories: Category[];
  action: (state: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  item?: Item;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(item?.price ?? "");
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
            <Input id="name" name="name" defaultValue={item?.name} required />
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

          <p className="text-sm text-muted-foreground">
            Total stock value: <span className="font-medium text-foreground">{formatNaira(total)}</span>
          </p>

          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : item ? "Save changes" : "Add item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
