"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteSale } from "@/lib/actions/sales";

export function DeleteSaleButton({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  const [error, setError] = useState<string>();

  return (
    <>
      <ConfirmDialog
        title="Delete this sale?"
        description={`${description}. The quantity will be added back to stock. This can't be undone.`}
        confirmLabel="Delete sale"
        destructive
        onConfirm={async () => {
          const result = await deleteSale(id);
          setError(result.error);
        }}
        trigger={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            aria-label="Delete sale"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        }
      />
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </>
  );
}
