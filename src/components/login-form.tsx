"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoginState } from "@/lib/actions/auth";

export function LoginForm({
  action,
  title,
  subtitle,
}: {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
  title: string;
  subtitle: string;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    action,
    {},
  );

  return (
    <form
      action={formAction}
      className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-8 shadow-sm"
    >
      <div className="space-y-1 text-center">
        <h1 className="font-serif text-2xl text-brand-green">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
