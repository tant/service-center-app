import { PageHeader } from "@/components/page-header";
import { TeamTable, teamSchema } from "@/components/team-table";
import { z } from "zod";

// Sample data for demonstration - in a real app this would come from your database
const sampleTeamData: z.infer<typeof teamSchema>[] = [
  {
    id: "1",
    user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    full_name: "John Smith",
    email: "john.smith@sstc.com",
    avatar_url: null,
    roles: ["admin"],
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
  },
  {
    id: "2",
    user_id: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    full_name: "Sarah Johnson",
    email: "sarah.johnson@sstc.com",
    avatar_url: null,
    roles: ["manager"],
    is_active: true,
    created_at: "2024-02-01T09:15:00Z",
    updated_at: "2024-02-05T16:20:00Z",
  },
  {
    id: "3",
    user_id: "c3d4e5f6-g7h8-9012-cdef-345678901234",
    full_name: "Mike Chen",
    email: "mike.chen@sstc.com",
    avatar_url: null,
    roles: ["technician"],
    is_active: true,
    created_at: "2024-02-10T11:00:00Z",
    updated_at: "2024-02-15T13:30:00Z",
  },
  {
    id: "4",
    user_id: "d4e5f6g7-h8i9-0123-defg-456789012345",
    full_name: "Emily Davis",
    email: "emily.davis@sstc.com",
    avatar_url: null,
    roles: ["reception"],
    is_active: true,
    created_at: "2024-02-20T08:45:00Z",
    updated_at: "2024-02-25T12:15:00Z",
  },
  {
    id: "5",
    user_id: "e5f6g7h8-i9j0-1234-efgh-567890123456",
    full_name: "David Wilson",
    email: "david.wilson@sstc.com",
    avatar_url: null,
    roles: ["technician"],
    is_active: false,
    created_at: "2024-01-05T14:20:00Z",
    updated_at: "2024-03-01T10:10:00Z",
  },
];

export default function Page() {
  return (
    <>
      <PageHeader title="Team" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TeamTable data={sampleTeamData} />
          </div>
        </div>
      </div>
    </>
  );
}