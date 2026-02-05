/**
 * Inventory Management - Main Router
 *
 * Combines all inventory sub-routers:
 * - stock: Stock queries and management
 * - receipts: Stock receipts (Phiếu Nhập Kho)
 * - issues: Stock issues (Phiếu Xuất Kho)
 * - transfers: Stock transfers (Phiếu Chuyển Kho)
 * - serials: Serial number utilities
 */

import { router } from "../../trpc";
import { issuesRouter } from "./issues";
import { receiptsRouter } from "./receipts";
import { serialsRouter } from "./serials";
import { stockRouter } from "./stock";
import { transfersRouter } from "./transfers";

export const inventoryRouter = router({
  stock: stockRouter,
  receipts: receiptsRouter,
  issues: issuesRouter,
  transfers: transfersRouter,
  serials: serialsRouter,
});
