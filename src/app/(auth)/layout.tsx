import { redirect } from "next/navigation";
import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/utils/supabase/server";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  console.log("🛡️ [AUTH LAYOUT] Starting authentication check");

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // Log authentication result
  if (user) {
    console.log("🛡️ [AUTH LAYOUT] User authenticated:", {
      userId: user.id,
      email: user.email,
    });
  } else if (error) {
    console.log("🛡️ [AUTH LAYOUT] Auth error - redirecting to login:", {
      error: error.name,
      message: error.message,
    });
  } else {
    console.log("🛡️ [AUTH LAYOUT] No user session - redirecting to login");
  }

  // Redirect to login if no valid user session (whether due to error or missing session)
  // This handles invalid cookies, expired sessions, and missing auth gracefully
  if (!user || error) {
    redirect("/login");
  }

  console.log("🛡️ [AUTH LAYOUT] Authentication successful, rendering protected content");
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
      <Toaster />
    </SidebarProvider>
  );
}
