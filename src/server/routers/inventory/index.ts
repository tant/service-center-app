/**
 * Inventory Management - Main Router
 *
 * Combines all inventory sub-routers:
 * - stock: Stock queries and management
 * - receipts: Stock receipts (Phiếu Nhập Kho)
 * - issues: Stock issues (Phiếu Xuất Kho)
 * - transfers: Stock transfers (Phiếu Chuyển Kho)
 * - serials: Serial number utilities
 * - approvals: Approval workflows
 */

import { router } from "../../trpc";
import { stockRouter } from "./stock";
import { receiptsRouter } from "./receipts";
import { issuesRouter } from "./issues";
import { transfersRouter } from "./transfers";
import { serialsRouter } from "./serials";
import { approvalsRouter } from "./approvals";

export const inventoryRouter = router({
  stock: stockRouter,
  receipts: receiptsRouter,
  issues: issuesRouter,
  transfers: transfersRouter,
  serials: serialsRouter,
  approvals: approvalsRouter,
});
