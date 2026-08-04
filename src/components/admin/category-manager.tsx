"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { deleteCategory, type CategoryFormState } from "@/lib/actions/categories";

type Category = { id: string; name: string; itemCount: number };

export function CategoryRow({ category }: { category: Category }) {
  const deleteWithId = deleteCategory.bind(null, category.id);

  const [deleteState, deleteAction, deletePending] = useActionState<
    CategoryFormState,
    FormData
  >(deleteWithId, {});

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4">{category.name}</td>
      <td className="py-3 pr-4 text-muted-foreground">{category.itemCount}</td>
      <td className="py-3 text-right space-x-1">
        <CategoryFormDialog
          category={category}
          trigger={
            <Button size="sm" variant="outline">
              Edit
            </Button>
          }
        />
        <form action={deleteAction} className="inline">
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={deletePending}
          >
            Delete
          </Button>
        </form>
        {deleteState.error && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {deleteState.error}
          </p>
        )}
      </td>
    </tr>
  );
}
