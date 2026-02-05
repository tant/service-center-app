import { IconEye } from "@tabler/icons-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditTicketForm } from "@/components/edit-ticket-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTicketData(ticketId: string) {
  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from("service_tickets")
    .select(`
      *,
      customers (
        id,
        name,
        phone,
        email,
        address
      ),
      products (
        id,
        name,
        type,
        brands (
          id,
          name
        )
      ),
      service_ticket_parts (
        id,
        part_id,
        quantity,
        unit_price,
        total_price,
        parts (
          id,
          name,
          part_number,
          price
        )
      )
    `)
    .eq("id", ticketId)
    .single();

  if (error || !ticket) {
    return null;
  }

  return ticket;
}

export default async function Page({ params }: PageProps) {
  const { id: ticketId } = await params;
  const ticket = await getTicketData(ticketId);

  if (!ticket) {
    notFound();
  }

  return (
    <>
      <PageHeader title={`Chỉnh sửa phiếu ${ticket.ticket_number}`}>
        <Link href={`/operations/tickets/${ticketId}`}>
          <Button variant="outline" size="sm">
            <IconEye className="h-4 w-4" />
            Xem chi tiết phiếu
          </Button>
        </Link>
      </PageHeader>
      <div className="flex flex-1 flex-col p-4 lg:p-6">
        <EditTicketForm ticket={ticket} />
      </div>
    </>
  );
}
