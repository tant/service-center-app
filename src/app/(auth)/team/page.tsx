import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { TeamTable, type teamSchema } from "@/components/team-table";
import { createClient } from "@/utils/supabase/server";

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
  const teamData = await getTeamData();

  return (
    <>
      <PageHeader title="Đội ngũ" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TeamTable data={teamData} />
          </div>
        </div>
      </div>
    </>
  );
}
