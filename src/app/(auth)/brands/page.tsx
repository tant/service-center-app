import { PageHeader } from "@/components/page-header";
import { BrandsTable } from "@/components/brands-table";

// Dummy brands data
const brandsData = [
  {
    id: "1",
    name: "Zotac",
    logo_url: "https://images.unsplash.com/photo-1606813506174-7b2c8c9a9a6b?w=100&h=100&fit=crop&crop=center",
    description: "Nhà sản xuất card đồ họa và mainboard hàng đầu",
    website: "https://www.zotac.com",
    country: "Hong Kong",
    founded_year: 2006,
    products_count: 125,
    parts_count: 45,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-03-20T14:15:00Z",
  },
  {
    id: "2",
    name: "ASUS",
    logo_url: "https://images.unsplash.com/photo-1606813506174-7b2c8c9a9a6b?w=100&h=100&fit=crop&crop=center",
    description: "Tập đoàn công nghệ đa quốc gia từ Đài Loan",
    website: "https://www.asus.com",
    country: "Taiwan",
    founded_year: 1989,
    products_count: 280,
    parts_count: 89,
    is_active: true,
    created_at: "2024-01-10T09:15:00Z",
    updated_at: "2024-03-18T11:30:00Z",
  },
  {
    id: "3",
    name: "MSI",
    logo_url: "https://images.unsplash.com/photo-1606813506174-7b2c8c9a9a6b?w=100&h=100&fit=crop&crop=center",
    description: "Micro-Star International - chuyên về gaming hardware",
    website: "https://www.msi.com",
    country: "Taiwan",
    founded_year: 1986,
    products_count: 195,
    parts_count: 67,
    is_active: true,
    created_at: "2024-01-12T08:45:00Z",
    updated_at: "2024-03-22T16:20:00Z",
  },
  {
    id: "4",
    name: "Gigabyte",
    logo_url: "https://images.unsplash.com/photo-1606813506174-7b2c8c9a9a6b?w=100&h=100&fit=crop&crop=center",
    description: "Gigabyte Technology - mainboard và card đồ họa",
    website: "https://www.gigabyte.com",
    country: "Taiwan",
    founded_year: 1986,
    products_count: 220,
    parts_count: 78,
    is_active: true,
    created_at: "2024-01-08T07:20:00Z",
    updated_at: "2024-03-19T13:45:00Z",
  },
  {
    id: "5",
    name: "EVGA",
    logo_url: "https://images.unsplash.com/photo-1606813506174-7b2c8c9a9a6b?w=100&h=100&fit=crop&crop=center",
    description: "Extended Visual Gaming Array - card đồ họa NVIDIA",
    website: "https://www.evga.com",
    country: "USA",
    founded_year: 1999,
    products_count: 98,
    parts_count: 34,
    is_active: false,
    created_at: "2024-01-20T12:10:00Z",
    updated_at: "2024-03-15T10:05:00Z",
  },
  {
    id: "6",
    name: "Sapphire",
    logo_url: "https://images.unsplash.com/photo-1606813506174-7b2c8c9a9a6b?w=100&h=100&fit=crop&crop=center",
    description: "Sapphire Technology - chuyên card đồ họa AMD Radeon",
    website: "https://www.sapphiretech.com",
    country: "Hong Kong",
    founded_year: 2001,
    products_count: 87,
    parts_count: 29,
    is_active: true,
    created_at: "2024-01-25T15:30:00Z",
    updated_at: "2024-03-21T09:15:00Z",
  },
  {
    id: "7",
    name: "PowerColor",
    logo_url: "https://images.unsplash.com/photo-1606813506174-7b2c8c9a9a6b?w=100&h=100&fit=crop&crop=center",
    description: "TUL Corporation - card đồ họa AMD chuyên nghiệp",
    website: "https://www.powercolor.com",
    country: "Taiwan",
    founded_year: 1997,
    products_count: 56,
    parts_count: 18,
    is_active: true,
    created_at: "2024-02-01T11:45:00Z",
    updated_at: "2024-03-17T14:30:00Z",
  },
  {
    id: "8",
    name: "XFX",
    logo_url: "https://images.unsplash.com/photo-1606813506174-7b2c8c9a9a6b?w=100&h=100&fit=crop&crop=center",
    description: "XFX Technologies - card đồ họa AMD Radeon premium",
    website: "https://www.xfxforce.com",
    country: "USA",
    founded_year: 2002,
    products_count: 42,
    parts_count: 15,
    is_active: true,
    created_at: "2024-02-05T08:20:00Z",
    updated_at: "2024-03-16T12:40:00Z",
  }
];

export default function Page() {
  return (
    <>
      <PageHeader title="Thương hiệu" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <BrandsTable data={brandsData} />
          </div>
        </div>
      </div>
    </>
  );
}