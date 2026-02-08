"use client";

import { IconLoader } from "@tabler/icons-react";
import { trpc } from "@/components/providers/trpc-provider";
import { TeamTable } from "@/components/team-table";
import type { UserRole } from "@/lib/constants/roles";

export function TeamPageClient({
  currentUserRole,
}: {
  currentUserRole: UserRole;
}) {
  const { data, isLoading } = trpc.staff.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TeamTable data={data || []} currentUserRole={currentUserRole} />
  );
}
