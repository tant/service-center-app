import { redirect } from "next/navigation";
import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { TeamTable, type teamSchema } from "@/components/team-table";
import { createClient } from "@/utils/supabase/server";

// Force dynamic rendering for authenticated pages
export const dynamic = "force-dynamic";

async function getTeamData(): Promise<z.infer<typeof teamSchema>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching team data:", error);
    return [];
  }

  return data || [];
}

export default async function Page() {
  // Route guard: Only Admin and Manager can access /team page
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

  // Only admin and manager roles can access this page
  if (!["admin", "manager"].includes(profile.role)) {
    redirect("/unauthorized");
  }

  const teamData = await getTeamData();

  return (
    <>
      <PageHeader title="Đội ngũ" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TeamTable
              data={teamData}
              currentUserRole={
                profile.role as "admin" | "manager" | "technician" | "reception"
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
