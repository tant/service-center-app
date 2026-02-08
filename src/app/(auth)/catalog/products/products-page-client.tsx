"use client";

import { IconLoader } from "@tabler/icons-react";
import { trpc } from "@/components/providers/trpc-provider";
import { ProductTable } from "@/components/product-table";
import type { UserRole } from "@/lib/constants/roles";

export function ProductsPageClient({
  currentUserRole,
}: {
  currentUserRole: UserRole;
}) {
  const { data, isLoading } = trpc.products.getProductsForTable.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ProductTable data={data || []} currentUserRole={currentUserRole} />
  );
}
