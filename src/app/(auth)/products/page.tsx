import { PageHeader } from "@/components/page-header";
import { ProductTable, productSchema } from "@/components/product-table";
import { z } from "zod";

// Sample data for demonstration - in a real app this would come from your database
const sampleProductData: z.infer<typeof productSchema>[] = [
  {
    id: "1",
    name: "Samsung Galaxy S23 Ultra",
    sku: "SGS23U-512-BK",
    short_description: "Premium flagship smartphone with S Pen",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    type: "hardware",
    primary_image: null,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    id: "2",
    name: "iPhone 15 Pro Max",
    sku: "IP15PM-256-NT",
    short_description: "Latest iPhone with titanium design",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    type: "hardware",
    primary_image: null,
    created_at: "2024-02-01T09:15:00Z",
    updated_at: "2024-02-05T16:20:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  },
  {
    id: "3",
    name: "Samsung Smart TV 65\" QLED",
    sku: "QN65Q70C",
    short_description: "4K QLED Smart TV with Quantum HDR",
    brand: "Samsung",
    model: "QN65Q70C",
    type: "hardware",
    primary_image: null,
    created_at: "2024-02-10T11:00:00Z",
    updated_at: "2024-02-15T13:30:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  },
  {
    id: "4",
    name: "MacBook Pro 16-inch M3",
    sku: "MBP16-M3-1TB",
    short_description: "Professional laptop with M3 chip",
    brand: "Apple",
    model: "MacBook Pro 16",
    type: "hardware",
    primary_image: null,
    created_at: "2024-02-20T08:45:00Z",
    updated_at: "2024-02-25T12:15:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  },
  {
    id: "5",
    name: "Office 365 Business Premium",
    sku: null,
    short_description: "Complete productivity suite with cloud services",
    brand: "Microsoft",
    model: "Business Premium",
    type: "software",
    primary_image: null,
    created_at: "2024-01-05T14:20:00Z",
    updated_at: "2024-03-01T10:10:00Z",
    created_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    updated_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    id: "6",
    name: "USB-C Hub 7-in-1",
    sku: "USBC-HUB-7P",
    short_description: "Multi-port USB-C hub with HDMI and USB 3.0",
    brand: "Anker",
    model: "PowerExpand 7-in-1",
    type: "accessory",
    primary_image: null,
    created_at: "2024-03-10T16:30:00Z",
    updated_at: "2024-03-15T09:45:00Z",
    created_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
    updated_by: "c3d4e5f6-g7h8-9012-cdef-345678901234",
  },
  {
    id: "7",
    name: "Adobe Creative Cloud All Apps",
    sku: null,
    short_description: "Complete creative software suite",
    brand: "Adobe",
    model: "All Apps",
    type: "software",
    primary_image: null,
    created_at: "2024-01-25T13:15:00Z",
    updated_at: "2024-02-28T11:30:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    id: "8",
    name: "AirPods Pro (2nd generation)",
    sku: "APP2-USB-C",
    short_description: "Wireless earbuds with active noise cancellation",
    brand: "Apple",
    model: "AirPods Pro 2",
    type: "accessory",
    primary_image: null,
    created_at: "2024-03-05T12:00:00Z",
    updated_at: "2024-03-12T14:20:00Z",
    created_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    updated_by: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  },
];

export default function Page() {
  return (
    <>
      <PageHeader title="Products" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ProductTable data={sampleProductData} />
          </div>
        </div>
      </div>
    </>
  );
}