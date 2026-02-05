"use client";

/**
 * Product Search Component
 * Searchable select for products with brand and SKU display
 */

import { trpc } from "@/components/providers/trpc-provider";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";

interface ProductSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProductSearch({
  value,
  onValueChange,
  placeholder = "Tìm kiếm sản phẩm...",
  disabled = false,
  className,
}: ProductSearchProps) {
  const { data: products, isLoading } = trpc.products.getProducts.useQuery(
    undefined,
    { refetchOnMount: false, staleTime: 60000 },
  );

  const options: SearchableSelectOption[] = (products || []).map((p: any) => ({
    value: p.id,
    label: p.name,
    description: `${p.sku || "Không có SKU"} | ${p.brands?.name || "Không có thương hiệu"}`,
  }));

  return (
    <SearchableSelect
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={isLoading ? "Đang tải..." : placeholder}
      searchPlaceholder="Nhập để tìm kiếm..."
      emptyMessage="Không tìm thấy sản phẩm nào."
      disabled={disabled || isLoading}
      className={className}
      renderOption={(option) => (
        <div className="flex flex-col">
          <span className="font-medium">{option.label}</span>
          {option.description && (
            <span className="text-xs text-muted-foreground">
              {option.description}
            </span>
          )}
        </div>
      )}
    />
  );
}
