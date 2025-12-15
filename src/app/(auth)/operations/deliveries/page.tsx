// Pending Deliveries Page
// Story 1.14: Customer Delivery Confirmation Workflow - List View

import {
  DeliveryTable,
  type DeliveryTicket,
} from "@/components/delivery-table";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";

// Types for Supabase response
interface TicketCustomer {
  id: string;
  name: string | null;
  phone: string | null;
}

interface TicketProduct {
  id: string;
  name: string | null;
}

interface TicketProfile {
  id: string;
  full_name: string | null;
}

interface TicketRow {
  id: string;
  ticket_number: string;
  customer_id: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  customers: TicketCustomer | null;
  products: TicketProduct | null;
  profiles: TicketProfile | null;
}

async function getPendingDeliveries(): Promise<{
  tickets: DeliveryTicket[];
  total: number;
}> {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("service_tickets")
    .select(
      `
      id,
      ticket_number,
      customer_id,
      completed_at,
      assigned_to,
      customers (
        id,
        name,
        phone
      ),
      products (
        id,
        name
      ),
      profiles!service_tickets_assigned_to_fkey (
        id,
        full_name
      )
    `,
      { count: "exact" },
    )
    .eq("status", "ready_for_pickup")
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending deliveries:", error);
    return { tickets: [], total: 0 };
  }

  if (!data) return { tickets: [], total: 0 };

  // Transform database data to match DeliveryTicket schema
  const tickets: DeliveryTicket[] = (data as unknown as TicketRow[]).map(
    (ticket) => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      customer_id: ticket.customer_id,
      customer_name: ticket.customers?.name || null,
      customer_phone: ticket.customers?.phone || null,
      product_name: ticket.products?.name || null,
      completed_at: ticket.completed_at,
      assigned_to: ticket.assigned_to,
      assigned_to_name: ticket.profiles?.full_name || null,
    }),
  );

  return {
    tickets,
    total: count || 0,
  };
}

export default async function PendingDeliveriesPage() {
  const { tickets, total } = await getPendingDeliveries();

  return (
    <>
      <PageHeader title="Chờ giao hàng" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DeliveryTable data={tickets} total={total} />
          </div>
        </div>
      </div>
    </>
  );
}
