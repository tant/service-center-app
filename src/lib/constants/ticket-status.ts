/**
 * Ticket status flow definitions and validation
 * This file can be safely imported by both server and client code
 */

export const STATUS_FLOW = {
  pending: {
    label: "Chờ xử lý",
    next: ["in_progress", "cancelled"],
    terminal: false,
  },
  in_progress: {
    label: "Đang sửa chữa",
    next: ["ready_for_pickup", "cancelled"],
    terminal: false,
  },
  ready_for_pickup: {
    label: "Sẵn sàng bàn giao",
    next: ["completed", "cancelled"],
    terminal: false,
  },
  completed: {
    label: "Hoàn thành",
    next: [],
    terminal: true,
  },
  cancelled: {
    label: "Hủy bỏ",
    next: [],
    terminal: true,
  },
} as const;

export type TicketStatus = keyof typeof STATUS_FLOW;

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["completed", "cancelled"],
  completed: [], // Terminal state - cannot transition
  cancelled: [], // Terminal state - cannot transition
};
