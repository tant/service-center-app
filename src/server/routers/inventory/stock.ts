/**
 * Stock Router - Inventory stock queries and management
 */

import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import { requireAnyAuthenticated, requireManagerOrAbove } from "../../middleware/requireRole";
import type { StockSummary, AggregatedStock, InventoryStats } from "@/types/inventory";

export const stockRouter = router({
  /**
   * Get inventory stats for dashboard cards
   */
  getStats: publicProcedure.use(requireAnyAuthenticated).query(async ({ ctx }): Promise<InventoryStats> => {
    const { data, error } = await ctx.supabaseAdmin.rpc("get_inventory_stats");

    if (error) {
      throw new Error(`Failed to get inventory stats: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        total_skus: 0,
        total_declared: 0,
        total_actual: 0,
        critical_count: 0,
        warning_count: 0,
      };
    }

    const stats = data[0];
    return {
      total_skus: Number(stats.total_skus || 0),
      total_declared: Number(stats.total_declared || 0),
      total_actual: Number(stats.total_actual || 0),
      critical_count: Number(stats.critical_count || 0),
      warning_count: Number(stats.warning_count || 0),
    };
  }),

  /**
   * Get aggregated stock (for "All Warehouses" tab)
   */
  getAggregated: publicProcedure.use(requireAnyAuthenticated)
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["ok", "warning", "critical"]).optional(),
      })
    )
    .query(async ({ ctx, input }): Promise<AggregatedStock[]> => {
      const { data, error } = await ctx.supabaseAdmin.rpc("get_aggregated_stock", {
        search_term: input.search || null,
      });

      if (error) {
        throw new Error(`Failed to get aggregated stock: ${error.message}`);
      }

      let results = (data || []) as AggregatedStock[];

      // Filter by status if provided
      if (input.status) {
        results = results.filter((item) => item.stock_status === input.status);
      }

      return results;
    }),

  /**
   * Get detailed stock summary from view
   */
  getSummary: publicProcedure.use(requireAnyAuthenticated)
    .input(
      z.object({
        virtualWarehouseType: z.string().optional(),
        physicalWarehouseId: z.string().optional(),
        productId: z.string().optional(),
        status: z.enum(["ok", "warning", "critical"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }): Promise<StockSummary[]> => {
      let query = ctx.supabaseAdmin.from("v_stock_summary").select("*");

      // Apply filters
      if (input.virtualWarehouseType) {
        query = query.eq("virtual_warehouse_type", input.virtualWarehouseType);
      }

      if (input.physicalWarehouseId) {
        query = query.eq("physical_warehouse_id", input.physicalWarehouseId);
      }

      if (input.productId) {
        query = query.eq("product_id", input.productId);
      }

      if (input.status) {
        query = query.eq("stock_status", input.status);
      }

      if (input.search) {
        query = query.or(
          `product_name.ilike.%${input.search}%,sku.ilike.%${input.search}%`
        );
      }

      const { data, error } = await query.order("product_name", { ascending: true });

      if (error) {
        throw new Error(`Failed to get stock summary: ${error.message}`);
      }

      return (data || []) as StockSummary[];
    }),

  /**
   * Get stock by physical warehouse
   */
  getByPhysicalWarehouse: publicProcedure.use(requireAnyAuthenticated)
    .input(
      z.object({
        warehouseId: z.string(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }): Promise<StockSummary[]> => {
      let query = ctx.supabaseAdmin
        .from("v_stock_summary")
        .select("*")
        .eq("physical_warehouse_id", input.warehouseId);

      if (input.search) {
        query = query.or(
          `product_name.ilike.%${input.search}%,sku.ilike.%${input.search}%`
        );
      }

      const { data, error } = await query.order("product_name", { ascending: true });

      if (error) {
        throw new Error(`Failed to get stock by physical warehouse: ${error.message}`);
      }

      return (data || []) as StockSummary[];
    }),

  /**
   * Get stock by virtual warehouse
   */
  getByVirtualWarehouse: publicProcedure.use(requireAnyAuthenticated)
    .input(
      z.object({
        warehouseType: z.string(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }): Promise<StockSummary[]> => {
      let query = ctx.supabaseAdmin
        .from("v_stock_summary")
        .select("*")
        .eq("virtual_warehouse_type", input.warehouseType);

      if (input.search) {
        query = query.or(
          `product_name.ilike.%${input.search}%,sku.ilike.%${input.search}%`
        );
      }

      const { data, error } = await query.order("product_name", { ascending: true });

      if (error) {
        throw new Error(`Failed to get stock by virtual warehouse: ${error.message}`);
      }

      return (data || []) as StockSummary[];
    }),

  /**
   * Get stock for specific product with warehouse breakdown
   */
  getProductStockDetail: publicProcedure.use(requireAnyAuthenticated)
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from("v_stock_summary")
        .select("*")
        .eq("product_id", input.productId)
        .order("virtual_warehouse_type");

      if (error) {
        throw new Error(`Failed to get product stock detail: ${error.message}`);
      }

      return data || [];
    }),

  /**
   * Update product warehouse stock (Admin/Manager only)
   */
  updateStock: publicProcedure.use(requireManagerOrAbove)
    .input(
      z.object({
        id: z.string(),
        declaredQuantity: z.number().int().min(0).optional(),
        initialStockEntry: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check role
      const { data: profile } = await ctx.supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("user_id", ctx.user!.id)
        .single();

      if (!profile || !["admin", "manager"].includes(profile.role)) {
        throw new Error("Unauthorized: Only admin and manager can update stock");
      }

      // Admin can update initial_stock_entry, manager cannot
      const updateData: any = {};
      if (input.declaredQuantity !== undefined) {
        updateData.declared_quantity = input.declaredQuantity;
      }
      if (input.initialStockEntry !== undefined && profile.role === "admin") {
        updateData.initial_stock_entry = input.initialStockEntry;
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("product_warehouse_stock")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update stock: ${error.message}`);
      }

      return data;
    }),
});
