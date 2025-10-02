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
  console.log("[TicketDetailPage] === START getTicketData ===");
  console.log("[TicketDetailPage] Input ticketId:", ticketId);
  console.log("[TicketDetailPage] ticketId type:", typeof ticketId);
  console.log("[TicketDetailPage] ticketId length:", ticketId?.length);
  console.log("[TicketDetailPage] ticketId is valid UUID:", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId));

  console.log("[TicketDetailPage] Creating Supabase client...");
  const supabase = await createClient();
  console.log("[TicketDetailPage] Supabase client created");

  console.log("[TicketDetailPage] Executing query with ID:", ticketId);

  const queryStart = Date.now();
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
          full_name,
          roles
        )
      )
    `)
    .eq("id", ticketId)
    .single();

  const queryDuration = Date.now() - queryStart;
  console.log("[TicketDetailPage] Query completed in:", queryDuration, "ms");

  if (error) {
    console.error("[TicketDetailPage] === DATABASE ERROR ===");
    console.error("[TicketDetailPage] Error object:", error);
    console.error("[TicketDetailPage] Error message:", error.message);
    console.error("[TicketDetailPage] Error code:", error.code);
    console.error("[TicketDetailPage] Error details:", error.details);
    console.error("[TicketDetailPage] Error hint:", error.hint);
    console.error("[TicketDetailPage] Full error:", JSON.stringify(error, null, 2));
    console.error("[TicketDetailPage] === END DATABASE ERROR ===");
    return null;
  }

  console.log("[TicketDetailPage] Query returned data:", !!ticket);
  console.log("[TicketDetailPage] Data is null:", ticket === null);
  console.log("[TicketDetailPage] Data is undefined:", ticket === undefined);

  if (!ticket) {
    console.warn("[TicketDetailPage] === TICKET NOT FOUND ===");
    console.warn("[TicketDetailPage] No ticket data returned for ID:", ticketId);
    console.warn("[TicketDetailPage] This will trigger 404");
    console.warn("[TicketDetailPage] === END TICKET NOT FOUND ===");
    return null;
  }

  console.log("[TicketDetailPage] === TICKET DATA LOADED ===");
  console.log("[TicketDetailPage] Ticket ID:", ticket.id);
  console.log("[TicketDetailPage] Ticket Number:", ticket.ticket_number);
  console.log("[TicketDetailPage] Status:", ticket.status);
  console.log("[TicketDetailPage] Customer ID:", ticket.customer_id);
  console.log("[TicketDetailPage] Customer object:", !!ticket.customers);
  console.log("[TicketDetailPage] Customer name:", ticket.customers?.name);
  console.log("[TicketDetailPage] Product ID:", ticket.product_id);
  console.log("[TicketDetailPage] Product object:", !!ticket.products);
  console.log("[TicketDetailPage] Product name:", ticket.products?.name);
  console.log("[TicketDetailPage] Parts array:", Array.isArray(ticket.service_ticket_parts));
  console.log("[TicketDetailPage] Parts count:", ticket.service_ticket_parts?.length || 0);
  console.log("[TicketDetailPage] Comments array:", Array.isArray(ticket.service_ticket_comments));
  console.log("[TicketDetailPage] Comments count:", ticket.service_ticket_comments?.length || 0);
  console.log("[TicketDetailPage] Service Fee:", ticket.service_fee);
  console.log("[TicketDetailPage] Diagnosis Fee:", ticket.diagnosis_fee);
  console.log("[TicketDetailPage] Parts Total:", ticket.parts_total);
  console.log("[TicketDetailPage] Total Cost:", ticket.total_cost);
  console.log("[TicketDetailPage] Full ticket object keys:", Object.keys(ticket));
  console.log("[TicketDetailPage] === END TICKET DATA ===");

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

function getWarrantyType(warrantyType: string) {
  const warrantyMap = {
    warranty: "Bảo hành",
    paid: "Trả phí",
  };
  return warrantyMap[warrantyType as keyof typeof warrantyMap] || warrantyType;
}

export default async function Page({ params }: PageProps) {
  console.log("[TicketDetailPage] ========== PAGE COMPONENT START ==========");
  console.log("[TicketDetailPage] Awaiting params...");
  const resolvedParams = await params;
  console.log("[TicketDetailPage] Params resolved:", resolvedParams);

  const ticketId = resolvedParams["ticket-id"];
  console.log("[TicketDetailPage] Extracted ticketId:", ticketId);
  console.log("[TicketDetailPage] ticketId type:", typeof ticketId);
  console.log("[TicketDetailPage] ticketId value:", JSON.stringify(ticketId));

  console.log("[TicketDetailPage] Calling getTicketData with ID:", ticketId);
  const ticket = await getTicketData(ticketId);
  console.log("[TicketDetailPage] getTicketData returned:", ticket ? "DATA" : "NULL");

  if (!ticket) {
    console.error("[TicketDetailPage] ========== 404 TRIGGERED ==========");
    console.error("[TicketDetailPage] No ticket data available");
    console.error("[TicketDetailPage] ticketId was:", ticketId);
    console.error("[TicketDetailPage] Calling notFound() to show 404 page");
    console.error("[TicketDetailPage] ========== END 404 ==========");
    notFound();
  }

  console.log("[TicketDetailPage] ========== SUCCESS - RENDERING PAGE ==========");
  console.log("[TicketDetailPage] Ticket Number:", ticket.ticket_number);
  console.log("[TicketDetailPage] Has Customer:", !!ticket.customers);
  console.log("[TicketDetailPage] Has Product:", !!ticket.products);
  console.log("[TicketDetailPage] Has Parts:", (ticket.service_ticket_parts?.length || 0) > 0);
  console.log("[TicketDetailPage] Has Comments:", (ticket.service_ticket_comments?.length || 0) > 0);
  console.log("[TicketDetailPage] ========== PROCEEDING TO RENDER ==========");

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
                <span>{getWarrantyType(ticket.warranty_type)}</span>
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
