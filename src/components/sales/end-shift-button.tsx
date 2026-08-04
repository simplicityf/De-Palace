"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { endShift } from "@/lib/actions/shifts";

export function EndShiftButton({ shiftId }: { shiftId: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button type="button" variant="outline">
          End shift
        </Button>
      }
      title="End your shift?"
      description="You won't be able to record more sales after this. A summary will be emailed to you and the admin."
      confirmLabel="End shift"
      destructive
      onConfirm={() => endShift(shiftId)}
    />
  );
}
