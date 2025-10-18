"use client";

import { useActionState, useEffect, useRef } from "react";
import { login, type LoginState } from "@/app/(public)/login/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    { success: false },
  );

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  console.log("📋 [LOGIN FORM] Rendering login form", {
    hasError: !!state?.error,
    hasFieldErrors: !!state?.fieldErrors,
    isPending: pending,
  });

  // Focus on first error field when errors appear
  useEffect(() => {
    if (state?.fieldErrors?.email) {
      emailInputRef.current?.focus();
    } else if (state?.fieldErrors?.password) {
      passwordInputRef.current?.focus();
    } else if (state?.error) {
      // Announce error to screen readers
      errorRef.current?.focus();
    }
  }, [state?.fieldErrors, state?.error]);

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      action={formAction}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email and password to access your account
        </p>
      </div>

      {state?.error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-3 rounded-lg border p-4 outline-none"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Unable to sign in</p>
            <p className="text-sm opacity-90">{state.error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            ref={emailInputRef}
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
            autoFocus
            disabled={pending}
            aria-invalid={!!state?.fieldErrors?.email}
            aria-describedby={
              state?.fieldErrors?.email ? "email-error" : undefined
            }
            className={cn(
              state?.fieldErrors?.email &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {state?.fieldErrors?.email && (
            <p
              id="email-error"
              className="text-destructive text-sm"
              role="alert"
            >
              {state.fieldErrors.email}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            ref={passwordInputRef}
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            disabled={pending}
            aria-invalid={!!state?.fieldErrors?.password}
            aria-describedby={
              state?.fieldErrors?.password ? "password-error" : undefined
            }
            className={cn(
              state?.fieldErrors?.password &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {state?.fieldErrors?.password && (
            <p
              id="password-error"
              className="text-destructive text-sm"
              role="alert"
            >
              {state.fieldErrors.password}
            </p>
          )}
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </div>
    </form>
  );
}
