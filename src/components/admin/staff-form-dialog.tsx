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
  createSalesAssistant,
  updateSalesAssistant,
  type StaffFormState,
} from "@/lib/actions/staff";

type Staff = { id: string; name: string; email: string };

export function StaffFormDialog({
  staff,
  trigger,
}: {
  staff?: Staff;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  const action = staff
    ? updateSalesAssistant.bind(null, staff.id)
    : createSalesAssistant;

  const [state, formAction, pending] = useActionState<StaffFormState, FormData>(
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
          <DialogTitle>
            {staff ? "Edit sales assistant" : "Add sales assistant"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff-name">Name</Label>
            <Input id="staff-name" name="name" defaultValue={staff?.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              name="email"
              type="email"
              defaultValue={staff?.email}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-password">
              {staff ? "New password (optional)" : "Temporary password"}
            </Label>
            <Input
              id="staff-password"
              name="password"
              type="text"
              minLength={8}
              required={!staff}
            />
            <p className="text-xs text-muted-foreground">
              {staff
                ? "Leave blank to keep their current password."
                : "At least 8 characters. Share this with the assistant directly."}
            </p>
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Saving…"
              : staff
                ? "Save changes"
                : "Add sales assistant"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
