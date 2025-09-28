import { PageHeader } from "@/components/page-header";
import { PartsTable, partSchema } from "@/components/parts-table";
import { z } from "zod";

// Sample data for demonstration - in a real app this would come from your database
const samplePartsData: z.infer<typeof partSchema>[] = [
  {
    id: "1",
    product_id: "1",
    name: "Galaxy S23 Ultra Screen",
    part_number: "GH82-28502A",
    sku: "SGS23U-SCREEN-BK",
    description: "6.8 inch Dynamic AMOLED 2X display assembly",
    price: 2500000,
    image_url: null,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    id: "2",
    product_id: "2",
    name: "iPhone 15 Pro Max Battery",
    part_number: "A3108",
    sku: "IP15PM-BATT",
    description: "4441mAh Li-Ion battery with flex cable",
    price: 1800000,
    image_url: null,
    created_at: "2024-02-01T09:15:00Z",
    updated_at: "2024-02-05T16:20:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  },
  {
    id: "3",
    product_id: "4",
    name: "MacBook Pro M3 Keyboard",
    part_number: "661-26802",
    sku: "MBP16-KB-US",
    description: "US English backlit keyboard with Touch ID",
    price: 3200000,
    image_url: null,
    created_at: "2024-02-10T11:00:00Z",
    updated_at: "2024-02-15T13:30:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  },
  {
    id: "4",
    product_id: "3",
    name: "Samsung TV Main Board",
    part_number: "BN94-17685A",
    sku: "QN65Q70C-MB",
    description: "Main logic board for 65 inch QLED TV",
    price: 4500000,
    image_url: null,
    created_at: "2024-02-20T08:45:00Z",
    updated_at: "2024-02-25T12:15:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  },
  {
    id: "5",
    product_id: "6",
    name: "USB-C Hub Circuit Board",
    part_number: "A2119-PCB",
    sku: "USBC-HUB-PCB",
    description: "Main circuit board for 7-in-1 USB-C hub",
    price: 450000,
    image_url: null,
    created_at: "2024-01-05T14:20:00Z",
    updated_at: "2024-03-01T10:10:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    id: "6",
    product_id: "8",
    name: "AirPods Pro 2 Left Speaker",
    part_number: "A2698-L",
    sku: "APP2-SPK-L",
    description: "Left ear speaker driver for AirPods Pro 2nd gen",
    price: 800000,
    image_url: null,
    created_at: "2024-03-10T16:30:00Z",
    updated_at: "2024-03-15T09:45:00Z",
    created_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
    updated_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  },
];

export default function Page() {
  return (
    <>
      <PageHeader title="Parts" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <PartsTable data={samplePartsData} />
          </div>
        </div>
      </div>
    </>
  );
}