import { redirect } from "next/navigation";
import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/utils/supabase/server";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  console.log("🛡️ [AUTH LAYOUT] Starting authentication check");

  try {
    console.log("🛡️ [AUTH LAYOUT] Calling createClient()");
    const supabase = await createClient();
    console.log("🛡️ [AUTH LAYOUT] Supabase client created successfully");

    console.log("🛡️ [AUTH LAYOUT] Getting current session...");
    const sessionResult = await supabase.auth.getSession();
    console.log("🛡️ [AUTH LAYOUT] Raw session result:", {
      hasData: !!sessionResult.data,
      hasSession: !!sessionResult.data?.session,
      hasUser: !!sessionResult.data?.session?.user,
      userId: sessionResult.data?.session?.user?.id || 'none',
      userEmail: sessionResult.data?.session?.user?.email || 'none',
      hasError: !!sessionResult.error,
      errorDetails: sessionResult.error ? {
        message: sessionResult.error.message,
        status: sessionResult.error.status,
        name: sessionResult.error.name
      } : null
    });

    const {
      data: { session },
      error,
    } = sessionResult;

  console.log("🛡️ [AUTH LAYOUT] Session check result:", {
    hasSession: !!session,
    hasError: !!error,
    sessionId: session?.user?.id || "none",
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
      try {
        console.log("🛡️ [AUTH LAYOUT] Attempting redirect to /login due to error");
        redirect("/login");
      } catch (redirectError) {
        console.error("🛡️ [AUTH LAYOUT] Error during redirect:", redirectError);
        throw redirectError;
      }
    }

    if (!session) {
      console.log("🛡️ [AUTH LAYOUT] No session found, redirecting to /login");
      try {
        console.log("🛡️ [AUTH LAYOUT] Attempting redirect to /login due to no session");
        redirect("/login");
      } catch (redirectError) {
        console.error("🛡️ [AUTH LAYOUT] Error during redirect:", redirectError);
        throw redirectError;
      }
    }

    console.log(
      "🛡️ [AUTH LAYOUT] Authentication successful, rendering protected content",
    );
  } catch (authError) {
    console.error("🛡️ [AUTH LAYOUT] Unexpected error in auth layout:", authError);
    console.error("🛡️ [AUTH LAYOUT] Auth error stack:", authError instanceof Error ? authError.stack : 'No stack trace available');
    // Try to redirect to login on any error
    try {
      redirect("/login");
    } catch (finalRedirectError) {
      console.error("🛡️ [AUTH LAYOUT] Final redirect error:", finalRedirectError);
      throw finalRedirectError;
    }
  }
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
