/**
 * Workflow constants and labels
 * Shared across workflow-related components
 */

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  service_ticket: "Phiếu sửa chữa",
  service_request: "Phiếu yêu cầu dịch vụ",
  inventory_receipt: "Phiếu nhập kho",
  inventory_issue: "Phiếu xuất kho",
  inventory_transfer: "Phiếu chuyển kho",
} as const;

export type EntityType = keyof typeof ENTITY_TYPE_LABELS;

export const ENTITY_TYPES = Object.keys(ENTITY_TYPE_LABELS) as EntityType[];
