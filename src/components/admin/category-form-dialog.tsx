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
  createCategory,
  renameCategory,
  type CategoryFormState,
} from "@/lib/actions/categories";

type Category = { id: string; name: string };

export function CategoryFormDialog({
  category,
  trigger,
}: {
  category?: Category;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  const action = category ? renameCategory.bind(null, category.id) : createCategory;

  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);
      if (!result.error) setOpen(false);
      return result;
    },
    {},
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              name="name"
              defaultValue={category?.name}
              placeholder="e.g. Palmwine"
              required
            />
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : category ? "Save changes" : "Add category"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
