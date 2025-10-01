/**
 * Label mappings for ticket fields
 */

export const PRIORITY_LABELS = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  urgent: "Khẩn cấp",
} as const;

export const WARRANTY_LABELS = {
  warranty: "Bảo hành",
  paid: "Trả phí",
  goodwill: "Thiện chí",
} as const;

export type PriorityLevel = keyof typeof PRIORITY_LABELS;
export type WarrantyType = keyof typeof WARRANTY_LABELS;
