/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 5: Warehouse management UI at /dashboard/warehouses
 *
 * Features:
 * - Tab-based interface for Physical and Virtual warehouses
 * - Physical warehouses table with CRUD operations
 * - Virtual warehouses table (read-only, showing seeded data)
 * - Create/Edit warehouse modal
 *
 * RBAC: Only Admin and Manager can access this page
 */

import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { WarehouseContent } from "@/components/warehouse/warehouse-content";
import { createClient } from "@/utils/supabase/server";

// Force dynamic rendering for authenticated pages
export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  // Route guard: Only Admin and Manager can access warehouse management
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching user profile:", profileError);
    redirect("/login");
  }

  // Only admin and manager roles can access warehouse management
  if (!["admin", "manager"].includes(profile.role)) {
    redirect("/unauthorized");
  }

  return (
    <>
      <PageHeader title="Quản lý Kho" />
      <WarehouseContent />
    </>
  );
}
