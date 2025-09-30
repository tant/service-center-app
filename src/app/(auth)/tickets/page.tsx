import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { TicketTable, type ticketSchema } from "@/components/ticket-table";

// Sample data for demonstration - in a real app this would come from your database
const sampleTicketData: z.infer<typeof ticketSchema>[] = [
  {
    id: "1",
    ticket_number: "SV-2024-001",
    customer_id: "1",
    customer_name: "Nguyễn Văn Anh",
    title: "Thay màn hình Samsung Galaxy S23 Ultra",
    description:
      "Khách hàng làm rơi điện thoại, màn hình bị vỡ và không hiển thị được",
    status: "in_progress" as const,
    priority: "high" as const,
    assigned_to: "c3d4e5f6-g7h8-9012-cdef-345678901234",
    assigned_to_name: "Mike Chen",
    estimated_total: 2800000,
    actual_total: null,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  },
  {
    id: "2",
    ticket_number: "SV-2024-002",
    customer_id: "2",
    customer_name: "Trần Thị Bình",
    title: "Thay pin iPhone 15 Pro Max",
    description: "Pin bị phù, sạc không lên và nóng bất thường",
    status: "open" as const,
    priority: "medium" as const,
    assigned_to: null,
    assigned_to_name: null,
    estimated_total: 2000000,
    actual_total: null,
    created_at: "2024-02-01T09:15:00Z",
    updated_at: "2024-02-05T16:20:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  },
  {
    id: "3",
    ticket_number: "SV-2024-003",
    customer_id: "3",
    customer_name: "Lê Hoàng Minh",
    title: "Sửa chữa MacBook Pro 16-inch M3",
    description: "Bàn phím không hoạt động, một số phím bị liệt",
    status: "resolved" as const,
    priority: "high" as const,
    assigned_to: "c3d4e5f6-g7h8-9012-cdef-345678901234",
    assigned_to_name: "Mike Chen",
    estimated_total: 3500000,
    actual_total: 3200000,
    created_at: "2024-02-10T11:00:00Z",
    updated_at: "2024-02-15T13:30:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  },
  {
    id: "4",
    ticket_number: "SV-2024-004",
    customer_id: "4",
    customer_name: "Phạm Thị Lan",
    title: "Kiểm tra và bảo trì Samsung TV 65 inch",
    description: "TV không bật được, có thể do nguồn hoặc bo mạch chủ",
    status: "open" as const,
    priority: "urgent" as const,
    assigned_to: null,
    assigned_to_name: null,
    estimated_total: 5000000,
    actual_total: null,
    created_at: "2024-02-20T08:45:00Z",
    updated_at: "2024-02-25T12:15:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  },
  {
    id: "5",
    ticket_number: "SV-2024-005",
    customer_id: "6",
    customer_name: "Đặng Thị Hương",
    title: "Cài đặt phần mềm Office 365",
    description: "Cài đặt và cấu hình Office 365 cho 10 máy tính trong công ty",
    status: "closed" as const,
    priority: "low" as const,
    assigned_to: "d4e5f6g7-h8i9-0123-defg-456789012345",
    assigned_to_name: "Emily Davis",
    estimated_total: 800000,
    actual_total: 750000,
    created_at: "2024-01-05T14:20:00Z",
    updated_at: "2024-03-01T10:10:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "d4e5f6g7-h8i9-0123-defg-456789012345",
  },
  {
    id: "6",
    ticket_number: "SV-2024-006",
    customer_id: "1",
    customer_name: "Nguyễn Văn Anh",
    title: "Thay loa AirPods Pro 2",
    description: "Loa trái không phát ra âm thanh, có thể do hư hỏng driver",
    status: "in_progress" as const,
    priority: "medium" as const,
    assigned_to: "c3d4e5f6-g7h8-9012-cdef-345678901234",
    assigned_to_name: "Mike Chen",
    estimated_total: 1000000,
    actual_total: null,
    created_at: "2024-03-10T16:30:00Z",
    updated_at: "2024-03-15T09:45:00Z",
    created_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
    updated_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  },
];

export default function Page() {
  return (
    <>
      <PageHeader title="Phiếu Dịch Vụ" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TicketTable data={sampleTicketData} />
          </div>
        </div>
      </div>
    </>
  );
}
