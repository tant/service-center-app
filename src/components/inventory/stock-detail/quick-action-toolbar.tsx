"use client";

/**
 * Quick Action Toolbar Component
 * Sticky toolbar providing quick access to warehouse operations
 */

import { PackageMinus, PackagePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface QuickActionToolbarProps {
  productId: string;
}

export function QuickActionToolbar({ productId }: QuickActionToolbarProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center justify-end gap-2 px-4 py-3 lg:px-6">
        {/* Nhập Kho */}
        <Button asChild size="sm" variant="default">
          <Link href={`/inventory/receipts/new?productId=${productId}`}>
            <PackagePlus className="h-4 w-4 mr-2" />
            Nhập Kho
          </Link>
        </Button>

        {/* Xuất Kho */}
        <Button asChild size="sm" variant="outline">
          <Link href={`/inventory/issues/new?productId=${productId}`}>
            <PackageMinus className="h-4 w-4 mr-2" />
            Xuất Kho
          </Link>
        </Button>
      </div>
    </div>
  );
}
