import type { z } from "zod";
import {
  CustomerTable,
  type customerSchema,
} from "@/components/customer-table";
import { PageHeader } from "@/components/page-header";

// Sample data for demonstration - in a real app this would come from your database
const sampleCustomerData: z.infer<typeof customerSchema>[] = [
  {
    id: "1",
    name: "Nguyễn Văn Anh",
    email: "nguyen.van.anh@gmail.com",
    phone: "0912345678",
    address: "123 Đường Lê Lợi, Quận 1",
    city: "Hồ Chí Minh",
    company: "Công ty TNHH ABC",
    notes: "Khách hàng VIP, thường xuyên sử dụng dịch vụ",
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    id: "2",
    name: "Trần Thị Bình",
    email: "tran.thi.binh@outlook.com",
    phone: "0987654321",
    address: "456 Đường Nguyễn Huệ, Quận 3",
    city: "Hồ Chí Minh",
    company: null,
    notes: null,
    is_active: true,
    created_at: "2024-02-01T09:15:00Z",
    updated_at: "2024-02-05T16:20:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  },
  {
    id: "3",
    name: "Lê Hoàng Minh",
    email: "le.hoang.minh@company.vn",
    phone: "0123456789",
    address: "789 Đường Điện Biên Phủ, Quận Bình Thạnh",
    city: "Hồ Chí Minh",
    company: "Tập đoàn XYZ",
    notes: "Cần báo giá cho đơn hàng lớn",
    is_active: true,
    created_at: "2024-02-10T11:00:00Z",
    updated_at: "2024-02-15T13:30:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  },
  {
    id: "4",
    name: "Phạm Thị Lan",
    email: "pham.thi.lan@email.com",
    phone: "0234567890",
    address: "321 Đường Võ Văn Tần, Quận 3",
    city: "Hồ Chí Minh",
    company: "Cửa hàng điện thoại Lan",
    notes: "Khách hàng bán lẻ, thanh toán đúng hạn",
    is_active: true,
    created_at: "2024-02-20T08:45:00Z",
    updated_at: "2024-02-25T12:15:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  },
  {
    id: "5",
    name: "Võ Minh Tuấn",
    email: null,
    phone: "0345678901",
    address: "654 Đường Pasteur, Quận 1",
    city: "Hồ Chí Minh",
    company: null,
    notes: "Khách hàng cũ, không còn hoạt động",
    is_active: false,
    created_at: "2024-01-05T14:20:00Z",
    updated_at: "2024-03-01T10:10:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    id: "6",
    name: "Đặng Thị Hương",
    email: "dang.thi.huong@tech.vn",
    phone: "0456789012",
    address: "147 Đường Cách Mạng Tháng 8, Quận 10",
    city: "Hồ Chí Minh",
    company: "Công ty Công nghệ DEF",
    notes: "Chuyên về sửa chữa laptop, tablet",
    is_active: true,
    created_at: "2024-03-10T16:30:00Z",
    updated_at: "2024-03-15T09:45:00Z",
    created_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
    updated_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  },
];

export default function Page() {
  return (
    <>
      <PageHeader title="Customers" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <CustomerTable data={sampleCustomerData} />
          </div>
        </div>
      </div>
    </>
  );
}
