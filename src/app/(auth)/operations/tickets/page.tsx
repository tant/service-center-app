import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { TicketTable, type ticketSchema } from "@/components/ticket-table";
import { createClient } from "@/utils/supabase/server";

// Map database status to UI status
function mapStatus(
  dbStatus: string,
): "open" | "in_progress" | "resolved" | "closed" {
  switch (dbStatus) {
    case "pending":
      return "open";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "resolved";
    case "cancelled":
      return "closed";
    default:
      return "open";
  }
}

// Map database priority to UI priority
function mapPriority(dbPriority: string): "low" | "medium" | "high" | "urgent" {
  switch (dbPriority) {
    case "low":
      return "low";
    case "normal":
      return "medium";
    case "high":
      return "high";
    case "urgent":
      return "urgent";
    default:
      return "medium";
  }
}

async function getTicketsData(): Promise<z.infer<typeof ticketSchema>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_tickets")
    .select(`
      *,
      customers (
        id,
        name,
        phone,
        email
      ),
      products (
        id,
        name,
        type,
        brands (
          id,
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets data:", error);
    return [];
  }

  if (!data) return [];

  // Transform database data to match UI expectations
  return data.map((ticket) => ({
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    customer_id: ticket.customer_id,
    customer_name: ticket.customers?.name || "Không có tên",
    title: `${ticket.products?.name || "Sản phẩm"} - ${ticket.products?.type || ""}`,
    description: ticket.issue_description,
    status: mapStatus(ticket.status),
    priority: mapPriority(ticket.priority_level),
    assigned_to: ticket.assigned_to,
    assigned_to_name: null, // TODO: Add profile join
    estimated_total: ticket.total_cost ? Number(ticket.total_cost) : null,
    actual_total:
      ticket.status === "completed" ? Number(ticket.total_cost) : null,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    created_by: ticket.created_by || "",
    updated_by: ticket.updated_by || "",
  }));
}

export default async function Page() {
  const ticketsData = await getTicketsData();

  return (
    <>
      <PageHeader title="Phiếu Dịch Vụ" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TicketTable data={ticketsData} />
          </div>
        </div>
      </div>
    </>
  );
}
