// Warehouse Management Hooks
// Custom hooks for warehouse operations, stock management, and product tracking

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/components/providers/trpc-provider';
import type {
  PhysicalWarehouse,
  VirtualWarehouse,
  PhysicalProduct,
  WarehouseStockLevel,
  StockMovement,
  SerialVerification,
} from '@/types/warehouse';

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * Hooks for managing physical and virtual warehouses
 */

/**
 * Hook for listing physical warehouses
 * Supports optional filtering by is_active status
 */
export function usePhysicalWarehouses(filters?: { is_active?: boolean }) {
  const { data: warehouses, isLoading, error } = trpc.warehouse.listPhysicalWarehouses.useQuery(filters);

  return {
    warehouses: warehouses ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook for creating new physical warehouse
 * Admin/Manager only
 */
export function useCreatePhysicalWarehouse() {
  const utils = trpc.useUtils();
  const mutation = trpc.warehouse.createPhysicalWarehouse.useMutation({
    onSuccess: () => {
      utils.warehouse.listPhysicalWarehouses.invalidate();
      toast.success('Physical warehouse created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create physical warehouse');
    },
  });

  return {
    createWarehouse: mutation.mutate,
    isCreating: mutation.isPending,
  };
}

/**
 * Hook for updating physical warehouse
 * Admin/Manager only
 */
export function useUpdatePhysicalWarehouse() {
  const utils = trpc.useUtils();
  const mutation = trpc.warehouse.updatePhysicalWarehouse.useMutation({
    onSuccess: () => {
      utils.warehouse.listPhysicalWarehouses.invalidate();
      toast.success('Physical warehouse updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update physical warehouse');
    },
  });

  return {
    updateWarehouse: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

/**
 * Hook for deleting physical warehouse (soft delete)
 * Admin/Manager only
 */
export function useDeletePhysicalWarehouse() {
  const utils = trpc.useUtils();
  const mutation = trpc.warehouse.deletePhysicalWarehouse.useMutation({
    onSuccess: () => {
      utils.warehouse.listPhysicalWarehouses.invalidate();
      toast.success('Physical warehouse deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete physical warehouse');
    },
  });

  return {
    deleteWarehouse: mutation.mutate,
    isDeleting: mutation.isPending,
  };
}

/**
 * Hook for listing virtual warehouses
 * These are fixed/seeded warehouses representing logical inventory types
 */
export function useVirtualWarehouses() {
  const { data: warehouses, isLoading, error } = trpc.warehouse.listVirtualWarehouses.useQuery();

  return {
    warehouses: warehouses ?? [],
    isLoading,
    error,
  };
}

/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Hook for listing physical products with filters
 */
export function usePhysicalProducts(filters?: {
  physical_warehouse_id?: string;
  virtual_warehouse_type?: 'warranty_stock' | 'rma_staging' | 'dead_stock' | 'in_service' | 'parts';
  condition?: 'new' | 'refurbished' | 'used' | 'faulty' | 'for_parts';
  warranty_status?: 'active' | 'expired' | 'expiring_soon' | 'no_warranty';
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { data, isLoading, error } = trpc.inventory.listProducts.useQuery(filters ?? {});

  return {
    products: data?.products ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  };
}

/**
 * Hook for getting a single physical product by ID or serial
 */
export function usePhysicalProduct(params: { id?: string; serial_number?: string }) {
  const { data: product, isLoading, error } = trpc.inventory.getProduct.useQuery(params, {
    enabled: !!(params.id || params.serial_number),
  });

  return {
    product,
    isLoading,
    error,
  };
}

/**
 * Hook for creating new physical product
 * Admin/Manager/Technician only
 */
export function useCreatePhysicalProduct() {
  const utils = trpc.useUtils();
  const mutation = trpc.inventory.createProduct.useMutation({
    onSuccess: () => {
      utils.inventory.listProducts.invalidate();
      toast.success('Sản phẩm đã được đăng ký thành công');
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi đăng ký sản phẩm');
    },
  });

  return {
    createProduct: mutation.mutate,
    createProductAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

/**
 * Hook for updating physical product
 * Admin/Manager/Technician only
 */
export function useUpdatePhysicalProduct() {
  const utils = trpc.useUtils();
  const mutation = trpc.inventory.updateProduct.useMutation({
    onSuccess: () => {
      utils.inventory.listProducts.invalidate();
      utils.inventory.getProduct.invalidate();
      toast.success('Thông tin sản phẩm đã được cập nhật');
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi cập nhật sản phẩm');
    },
  });

  return {
    updateProduct: mutation.mutate,
    updateProductAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

/**
 * Hook for warehouse stock levels
 * TODO: Implement stock analytics
 */
export function useStockLevels(warehouseType?: string) {
  // TODO: Implement with tRPC view query
  const stockLevels: WarehouseStockLevel[] = [];
  const isLoading = false;
  const error = null;

  return {
    stockLevels,
    isLoading,
    error,
  };
}

/**
 * Hook for serial number verification
 * TODO: Implement real-time verification
 */
export function useSerialVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<SerialVerification | null>(null);

  const verifySerial = useCallback(async (serialNumber: string) => {
    // TODO: Implement tRPC query
    setIsVerifying(true);
    try {
      console.log('Verifying serial:', serialNumber);
      // Placeholder
      setVerification({
        serial_number: serialNumber,
        exists: false,
      });
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const resetVerification = useCallback(() => {
    setVerification(null);
  }, []);

  return {
    verifySerial,
    resetVerification,
    verification,
    isVerifying,
  };
}

/**
 * Hook for stock movements
 * TODO: Implement movement tracking
 */
export function useStockMovements(productId?: string) {
  // TODO: Implement with tRPC
  const movements: StockMovement[] = [];
  const isLoading = false;
  const error = null;

  return {
    movements,
    isLoading,
    error,
    // TODO: Add mutation (createMovement)
  };
}

/**
 * Hook for low stock alerts
 * TODO: Implement alert monitoring
 */
export function useLowStockAlerts() {
  // TODO: Implement with tRPC view query
  const alerts: any[] = [];
  const isLoading = false;
  const error = null;

  return {
    alerts,
    isLoading,
    error,
  };
}

/**
 * Hook for bulk product import from CSV
 * Admin/Manager only
 */
export function useBulkProductImport() {
  const utils = trpc.useUtils();
  const mutation = trpc.inventory.bulkImport.useMutation({
    onSuccess: (result) => {
      utils.inventory.listProducts.invalidate();
      if (result.error_count === 0) {
        toast.success(`Đã nhập thành công ${result.success_count} sản phẩm`);
      } else {
        toast.warning(`Đã nhập ${result.success_count} sản phẩm, ${result.error_count} lỗi`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi nhập sản phẩm hàng loạt');
    },
  });

  return {
    bulkImport: mutation.mutate,
    bulkImportAsync: mutation.mutateAsync,
    isImporting: mutation.isPending,
    result: mutation.data,
  };
}

/**
 * Hook for warehouse analytics
 * TODO: Implement analytics queries
 */
export function useWarehouseAnalytics(period: string = '30d') {
  // TODO: Implement with tRPC
  const analytics = null;
  const isLoading = false;
  const error = null;

  return {
    analytics,
    isLoading,
    error,
  };
}
