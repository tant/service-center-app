# Changelog - October 28, 2025

## Removed Stock Levels Page

**Date:** October 28, 2025

### Summary
Removed the `/inventory/stock-levels` page and all related code from the application.

### Changes Made

#### 1. Page Deletion
- **Deleted:** `/src/app/(auth)/inventory/stock-levels/page.tsx`
  - Removed the entire Stock Levels dashboard page
  - This page displayed warehouse stock levels with filters and low stock alerts

#### 2. Navigation Updates
- **Modified:** `/src/components/app-sidebar.tsx`
  - Removed "Mức tồn kho" (Stock Levels) menu item from inventory section (lines 98-104)
  - Navigation now goes directly from "Sản phẩm vật lý" to "Quản lý RMA"

#### 3. Hook Cleanup
- **Modified:** `/src/hooks/use-warehouse.ts`
  - Removed `useStockLevels()` hook - queried stock levels with filters
  - Removed `useLowStockAlerts()` hook - fetched low stock alerts with counts
  - Removed `useExportStockReport()` hook - exported stock reports to CSV
  - Removed `useSetThreshold()` hook - set stock thresholds for products

#### 4. API Cleanup
- **Modified:** `/src/server/routers/physical-products.ts`
  - Removed `getStockLevels` tRPC procedure - aggregated stock levels query
  - Removed `getLowStockAlerts` tRPC procedure - low stock alerts query
  - Removed `exportStockReport` tRPC procedure - CSV export functionality
  - Removed `setThreshold` tRPC procedure - stock threshold management

### Components Preserved
- **`StockStatusBadge`** component was preserved as it's still used by:
  - `/src/components/inventory/overview/inventory-table-virtual.tsx`
  - `/src/components/inventory/overview/inventory-table-physical.tsx`
  - `/src/components/inventory/overview/inventory-table-all.tsx`

### Build Verification
- ✅ Project builds successfully without errors
- ✅ Route `/inventory/stock-levels` no longer appears in build output
- ✅ All TypeScript types validated successfully

### Documentation Note
Documentation files in `/docs/stories/` and `/docs/reports/` still reference the stock levels feature, but this is expected as they serve as historical records.

### Impact
This change removes the dedicated stock levels monitoring page. Stock information is still accessible through:
- Inventory Overview page (`/inventory/overview`)
- Physical Products page (`/inventory/products`)
- Related inventory tables that display stock status badges
