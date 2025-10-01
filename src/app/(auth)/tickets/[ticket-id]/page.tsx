import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/server";
import { IconEdit, IconUser, IconPhone, IconMail, IconPackage, IconCalendar } from "@tabler/icons-react";
import Link from "next/link";
import { TicketComments } from "@/components/ticket-comments";

interface PageProps {
  params: Promise<{ "ticket-id": string }>;
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
        brand,
        model
      ),
      service_ticket_parts (
        id,
        quantity,
        unit_price,
        total_price,
        parts (
          id,
          name,
          part_number,
          sku
        )
      ),
      service_ticket_comments!service_ticket_comments_ticket_id_fkey (
        id,
        comment,
        is_internal,
        created_at,
        created_by,
        profiles!service_ticket_comments_created_by_fkey (
          id,
          name,
          role
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

function getStatusBadge(status: string) {
  const statusMap = {
    pending: { label: "Chờ xử lý", variant: "destructive" as const },
    in_progress: { label: "Đang xử lý", variant: "default" as const },
    completed: { label: "Hoàn thành", variant: "secondary" as const },
    cancelled: { label: "Đã hủy", variant: "outline" as const },
  };
  const statusConfig = statusMap[status as keyof typeof statusMap] || statusMap.pending;
  return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
}

function getPriorityBadge(priority: string) {
  const priorityMap = {
    low: { label: "Thấp", className: "bg-gray-100 text-gray-800" },
    normal: { label: "Bình thường", className: "bg-blue-100 text-blue-800" },
    high: { label: "Cao", className: "bg-orange-100 text-orange-800" },
    urgent: { label: "Khẩn cấp", className: "bg-red-100 text-red-800" },
  };
  const priorityConfig = priorityMap[priority as keyof typeof priorityMap] || priorityMap.normal;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityConfig.className}`}>
      {priorityConfig.label}
    </span>
  );
}

export default async function Page({ params }: PageProps) {
  const { "ticket-id": ticketId } = await params;
  const ticket = await getTicketData(ticketId);

  if (!ticket) {
    notFound();
  }

  return (
    <>
      <PageHeader title={`Phiếu Dịch Vụ ${ticket.ticket_number}`}>
        <Link href={`/tickets/${ticketId}/edit`}>
          <Button variant="outline" size="sm">
            <IconEdit className="h-4 w-4" />
            Chỉnh sửa
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        {/* Ticket Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phiếu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái:</span>
                {getStatusBadge(ticket.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Độ ưu tiên:</span>
                {getPriorityBadge(ticket.priority_level)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loại bảo hành:</span>
                <span className="capitalize">{ticket.warranty_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày tạo:</span>
                <span>{new Date(ticket.created_at).toLocaleDateString("vi-VN")}</span>
              </div>
              {ticket.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày hoàn thành:</span>
                  <span>{new Date(ticket.completed_at).toLocaleDateString("vi-VN")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Tên khách hàng</p>
                <p className="font-medium">{ticket.customers?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <IconPhone className="h-4 w-4 text-muted-foreground" />
                <span>{ticket.customers?.phone}</span>
              </div>
              {ticket.customers?.email && (
                <div className="flex items-center gap-2">
                  <IconMail className="h-4 w-4 text-muted-foreground" />
                  <span>{ticket.customers.email}</span>
                </div>
              )}
              {ticket.customers?.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="text-sm">{ticket.customers.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPackage className="h-5 w-5" />
              Thông tin sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Tên sản phẩm</p>
              <p className="font-medium">{ticket.products?.name}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Loại</p>
                <p>{ticket.products?.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thương hiệu</p>
                <p>{ticket.products?.brand || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p>{ticket.products?.model || "—"}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Mô tả vấn đề</p>
              <p className="mt-1">{ticket.issue_description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Parts Used */}
        {ticket.service_ticket_parts && ticket.service_ticket_parts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Linh kiện đã sử dụng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ticket.service_ticket_parts.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{item.parts?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.parts?.part_number} • Số lượng: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.total_price)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Chi phí</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giá dịch vụ:</span>
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(ticket.service_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí kiểm tra:</span>
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(ticket.diagnosis_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Linh kiện:</span>
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(ticket.parts_total)}</span>
              </div>
              {ticket.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giảm giá:</span>
                  <span className="text-red-600">-{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(ticket.discount_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-primary">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(ticket.total_cost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <TicketComments
          ticketId={ticketId}
          initialComments={ticket.service_ticket_comments || []}
        />
      </div>
    </>
  );
}
