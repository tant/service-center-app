import type { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { ProductTable, type productSchema } from "@/components/product-table";
import { createClient } from "@/utils/supabase/server";

async function getProductData(): Promise<z.infer<typeof productSchema>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching product data:", error);
    return [];
  }

  return data || [];
}

export default async function Page() {
  const productData = await getProductData();

  return (
    <>
      <PageHeader title="Products" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ProductTable data={productData} />
          </div>
        </div>
      </div>
    </>
  );
}
