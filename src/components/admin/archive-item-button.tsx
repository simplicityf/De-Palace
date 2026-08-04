"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { archiveItem } from "@/lib/actions/stock";

export function ArchiveItemButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={() => startTransition(() => archiveItem(id))}
    >
      {pending ? "Archiving…" : "Archive"}
    </Button>
  );
}
