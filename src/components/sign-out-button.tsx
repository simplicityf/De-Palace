"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { logout } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <ConfirmDialog
      trigger={
        <Button type="button" variant="destructive" size="sm">
          Sign out
        </Button>
      }
      title="Sign out?"
      description="You'll need to log in again to continue."
      confirmLabel="Sign out"
      destructive
      onConfirm={() => logout()}
    />
  );
}
