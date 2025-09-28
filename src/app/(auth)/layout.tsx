import { redirect } from "next/navigation";
import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  console.log("🛡️ [AUTH LAYOUT] Starting authentication check");

  const supabase = await createClient();
  console.log("🛡️ [AUTH LAYOUT] Supabase client created");

  console.log("🛡️ [AUTH LAYOUT] Getting current session...");
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  console.log("🛡️ [AUTH LAYOUT] Session check result:", {
    hasSession: !!session,
    hasError: !!error,
    sessionId: session?.id || "none",
    userEmail: session?.user?.email || "none",
    error: error
      ? {
          message: error.message,
          status: error.status,
          name: error.name,
        }
      : null,
  });

  if (error) {
    console.error(
      "🛡️ [AUTH LAYOUT] Supabase error occurred, redirecting to /login:",
      error,
    );
    // If Supabase errors, treat as unauthenticated and send to login.
    // Consider logging this in a real app.
    redirect("/login");
  }

  if (!session) {
    console.log("🛡️ [AUTH LAYOUT] No session found, redirecting to /login");
    redirect("/login");
  }

  console.log(
    "🛡️ [AUTH LAYOUT] Authentication successful, rendering protected content",
  );
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
