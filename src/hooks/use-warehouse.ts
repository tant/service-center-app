// Warehouse Management Hooks
// Custom hooks for warehouse operations, stock management, and product tracking

'use client';

import { useState, useCallback, useMemo } from 'react';
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
 * These are warehouses representing logical inventory types linked to physical locations
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
 * Hook for creating new virtual warehouse
 * Admin/Manager only
 */
export function useCreateVirtualWarehouse() {
  const utils = trpc.useUtils();
  const mutation = trpc.warehouse.createVirtualWarehouse.useMutation({
    onSuccess: () => {
      utils.warehouse.listVirtualWarehouses.invalidate();
      toast.success('Virtual warehouse created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create virtual warehouse');
    },
  });

  return {
    createWarehouse: mutation.mutate,
    isCreating: mutation.isPending,
  };
}

/**
 * Hook for updating virtual warehouse
 * Admin/Manager only
 */
export function useUpdateVirtualWarehouse() {
  const utils = trpc.useUtils();
  const mutation = trpc.warehouse.updateVirtualWarehouse.useMutation({
    onSuccess: () => {
      utils.warehouse.listVirtualWarehouses.invalidate();
      toast.success('Virtual warehouse updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update virtual warehouse');
    },
  });

  return {
    updateWarehouse: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

/**
 * Hook for deleting virtual warehouse (soft delete)
 * Admin/Manager only
 */
export function useDeleteVirtualWarehouse() {
  const utils = trpc.useUtils();
  const mutation = trpc.warehouse.deleteVirtualWarehouse.useMutation({
    onSuccess: () => {
      utils.warehouse.listVirtualWarehouses.invalidate();
      toast.success('Virtual warehouse deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete virtual warehouse');
    },
  });

  return {
    deleteWarehouse: mutation.mutate,
    isDeleting: mutation.isPending,
  };
}

/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Hook for listing physical products with filters
 */
export function usePhysicalProducts(filters?: {
  physical_warehouse_id?: string;
  virtual_warehouse_id?: string;
  condition?: 'new' | 'refurbished' | 'used' | 'faulty' | 'for_parts';
  warranty_status?: 'active' | 'expired' | 'expiring_soon' | 'no_warranty';
  search?: string;
  limit?: number;
  offset?: number;
}) {
  // Normalize filters to avoid unnecessary re-renders
  const normalizedFilters = filters ?? {};

  const { data, isLoading, error, isFetching } = trpc.physicalProducts.listProducts.useQuery(
    normalizedFilters,
    {
      staleTime: 30000, // Cache for 30 seconds
      gcTime: 300000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Return stable references - TanStack Query already handles this
  return {
    products: data?.products ?? [],
    total: data?.total ?? 0,
    isLoading: isLoading || isFetching,
    error,
  };
}

/**
 * Hook for getting a single physical product by ID or serial
 */
export function usePhysicalProduct(params: { id?: string; serial_number?: string }) {
  const { data: product, isLoading, error } = trpc.physicalProducts.getProduct.useQuery(params, {
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
  const mutation = trpc.physicalProducts.createProduct.useMutation({
    onSuccess: () => {
      utils.physicalProducts.listProducts.invalidate();
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
  const mutation = trpc.physicalProducts.updateProduct.useMutation({
    onSuccess: () => {
      utils.physicalProducts.listProducts.invalidate();
      utils.physicalProducts.getProduct.invalidate();
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
 * Story 1.8: Serial Number Verification and Stock Movements
 * Hook for serial number verification
 */
export function useSerialVerification() {
  const mutation = trpc.physicalProducts.verifySerial.useMutation();

  return {
    verifySerial: mutation.mutate,
    verifySerialAsync: mutation.mutateAsync,
    isVerifying: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Hook for recording product movement
 * Admin/Manager/Technician only
 */
export function useRecordMovement() {
  const utils = trpc.useUtils();
  const mutation = trpc.physicalProducts.recordMovement.useMutation({
    onSuccess: () => {
      utils.physicalProducts.listProducts.invalidate();
      utils.physicalProducts.getProduct.invalidate();
      utils.physicalProducts.getMovementHistory.invalidate();
      toast.success('Đã ghi nhận di chuyển sản phẩm');
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi ghi nhận di chuyển');
    },
  });

  return {
    recordMovement: mutation.mutate,
    recordMovementAsync: mutation.mutateAsync,
    isRecording: mutation.isPending,
  };
}

/**
 * Hook for getting product movement history
 */
export function useMovementHistory(params: { product_id: string; limit?: number; offset?: number }) {
  const { data, isLoading, error } = trpc.physicalProducts.getMovementHistory.useQuery(params, {
    enabled: !!params.product_id,
  });

  return {
    movements: data?.movements ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  };
}

/**
 * Hook for assigning product to ticket
 * Admin/Manager/Technician/Reception
 */
export function useAssignToTicket() {
  const utils = trpc.useUtils();
  const mutation = trpc.physicalProducts.assignToTicket.useMutation({
    onSuccess: () => {
      utils.physicalProducts.listProducts.invalidate();
      utils.physicalProducts.getProduct.invalidate();
      utils.physicalProducts.getMovementHistory.invalidate();
      toast.success('Đã gán sản phẩm vào phiếu');
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi gán sản phẩm');
    },
  });

  return {
    assignToTicket: mutation.mutate,
    assignToTicketAsync: mutation.mutateAsync,
    isAssigning: mutation.isPending,
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
 * Hook for bulk product import from CSV
 * Admin/Manager only
 */
export function useBulkProductImport() {
  const utils = trpc.useUtils();
  const mutation = trpc.physicalProducts.bulkImport.useMutation({
    onSuccess: (result) => {
      utils.physicalProducts.listProducts.invalidate();
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

/**
 * Story 1.10: RMA Batch Operations
 * Hooks for managing RMA batches
 */

/**
 * Hook for listing RMA batches with pagination
 */
export function useRMABatches(filters?: {
  status?: 'draft' | 'submitted' | 'shipped' | 'completed';
  limit?: number;
  offset?: number;
}) {
  const { data, isLoading, error } = trpc.physicalProducts.getRMABatches.useQuery(filters ?? {});

  return {
    batches: data?.batches ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  };
}

/**
 * Hook for getting RMA batch details
 */
export function useRMABatchDetails(batchId: string) {
  const { data, isLoading, error } = trpc.physicalProducts.getRMABatchDetails.useQuery(
    { batch_id: batchId },
    { enabled: !!batchId }
  );

  return {
    batch: data?.batch,
    products: data?.products ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook for creating new RMA batch
 * Admin/Manager only
 */
export function useCreateRMABatch() {
  const utils = trpc.useUtils();
  const mutation = trpc.physicalProducts.createRMABatch.useMutation({
    onSuccess: () => {
      utils.physicalProducts.getRMABatches.invalidate();
      toast.success('Đã tạo lô RMA mới');
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi tạo lô RMA');
    },
  });

  return {
    createBatch: mutation.mutate,
    createBatchAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

/**
 * Hook for validating RMA serial numbers
 * Admin/Manager only
 */
export function useValidateRMASerials() {
  const mutation = trpc.physicalProducts.validateRMASerials.useMutation();

  return {
    validate: mutation.mutate,
    validateAsync: mutation.mutateAsync,
    isValidating: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
  };
}

/**
 * Hook for adding products to RMA batch
 * Admin/Manager only
 */
export function useAddProductsToRMA() {
  const utils = trpc.useUtils();
  const mutation = trpc.physicalProducts.addProductsToRMA.useMutation({
    onSuccess: (result) => {
      utils.physicalProducts.getRMABatches.invalidate();
      utils.physicalProducts.getRMABatchDetails.invalidate();
      utils.physicalProducts.listProducts.invalidate();

      if (result.errors && result.errors.length > 0) {
        toast.warning(`Đã thêm ${result.added} sản phẩm, ${result.errors.length} lỗi`);
      } else {
        toast.success(`Đã thêm ${result.added} sản phẩm vào lô RMA`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi thêm sản phẩm vào lô RMA');
    },
  });

  return {
    addProducts: mutation.mutate,
    addProductsAsync: mutation.mutateAsync,
    isAdding: mutation.isPending,
  };
}

/**
 * Hook for removing product from RMA batch
 * Admin/Manager only
 */
export function useRemoveProductFromRMA() {
  const utils = trpc.useUtils();
  const mutation = trpc.physicalProducts.removeProductFromRMA.useMutation({
    onSuccess: () => {
      utils.physicalProducts.getRMABatches.invalidate();
      utils.physicalProducts.getRMABatchDetails.invalidate();
      utils.physicalProducts.listProducts.invalidate();
      toast.success('Đã xóa sản phẩm khỏi lô RMA');
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi xóa sản phẩm khỏi lô RMA');
    },
  });

  return {
    removeProduct: mutation.mutate,
    removeProductAsync: mutation.mutateAsync,
    isRemoving: mutation.isPending,
  };
}

/**
 * Hook for finalizing RMA batch
 * Admin/Manager only
 */
export function useFinalizeRMABatch() {
  const utils = trpc.useUtils();
  const mutation = trpc.physicalProducts.finalizeRMABatch.useMutation({
    onSuccess: () => {
      utils.physicalProducts.getRMABatches.invalidate();
      utils.physicalProducts.getRMABatchDetails.invalidate();
      toast.success('Đã hoàn tất lô RMA');
    },
    onError: (error) => {
      toast.error(error.message || 'Lỗi khi hoàn tất lô RMA');
    },
  });

  return {
    finalizeBatch: mutation.mutate,
    finalizeBatchAsync: mutation.mutateAsync,
    isFinalizing: mutation.isPending,
  };
}
