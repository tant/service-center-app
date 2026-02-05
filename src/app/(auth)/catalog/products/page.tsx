import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { ProductTable, type productSchema } from "@/components/product-table";
import { createClient } from "@/utils/supabase/server";

async function getProductData(): Promise<z.infer<typeof productSchema>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      physical_products(count),
      brands:brand_id (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching product data:", error);
    return [];
  }

  // Transform the data to include physical_products_count and brand_name
  // Issue #9: Removed parts_count - Parts feature is disabled for MVP
  const transformedData = (data || []).map((product: any) => ({
    ...product,
    parts_count: 0, // Issue #9: Always 0 for MVP
    physical_products_count: product.physical_products?.[0]?.count || 0,
    brand_name: product.brands?.name || null,
  }));

  return transformedData;
}

export default async function Page() {
  const supabase = await createClient();
  const productData = await getProductData();

  // Get current user's role for permission checks
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userRole: "admin" | "manager" | "technician" | "reception" = "reception";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role) {
      userRole = profile.role as
        | "admin"
        | "manager"
        | "technician"
        | "reception";
    }
  }

  return (
    <>
      <PageHeader title="Sản phẩm" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ProductTable data={productData} currentUserRole={userRole} />
          </div>
        </div>
      </div>
    </>
  );
}
