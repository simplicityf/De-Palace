"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setStaffActive } from "@/lib/actions/staff";

export function ToggleStaffButton({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => setStaffActive(id, !isActive))}
    >
      {pending ? "Saving…" : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
