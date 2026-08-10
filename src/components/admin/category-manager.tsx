"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { deleteCategory, type CategoryFormState } from "@/lib/actions/categories";

type Category = { id: string; name: string; itemCount: number };

interface CategoryRowProps {
  category: Category;
  isMobile?: boolean;
}

export function CategoryRow({ category, isMobile = false }: CategoryRowProps) {
  const deleteWithId = deleteCategory.bind(null, category.id);

  const [deleteState, deleteAction, deletePending] = useActionState<
    CategoryFormState,
    FormData
  >(deleteWithId, {});

  const actionButtons = (
    <>
      <CategoryFormDialog
        category={category}
        trigger={
          <Button 
            size="sm" 
            variant="outline" 
            className={isMobile ? "flex-1" : ""}
          >
            Edit
          </Button>
        }
      />
      <form action={deleteAction} className={isMobile ? "flex-1" : "inline"}>
        <Button
          type="submit"
          size="sm"
          variant={isMobile ? "outline" : "ghost"}
          className={isMobile 
            ? "w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10" 
            : "text-destructive hover:text-destructive"
          }
          disabled={deletePending}
        >
          {deletePending ? "Deleting..." : "Delete"}
        </Button>
      </form>
      {deleteState.error && (
        <p role="alert" className={isMobile ? "col-span-2 mt-1 text-xs text-destructive" : "mt-1 text-xs text-destructive"}>
          {deleteState.error}
        </p>
      )}
    </>
  );

  // Mobile card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {actionButtons}
        </div>
        {deleteState.error && (
          <p role="alert" className="text-xs text-destructive">
            {deleteState.error}
          </p>
        )}
      </div>
    );
  }

  // Desktop table row layout
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
            {deletePending ? "Deleting..." : "Delete"}
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