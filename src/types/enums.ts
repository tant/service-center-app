// Phase 2 ENUM Type Exports
// Re-exports database ENUMs for use in frontend code

import type { Database } from './database.types';

// Phase 1 ENUMs
export type UserRole = Database['public']['Enums']['user_role'];
export type TicketStatus = Database['public']['Enums']['ticket_status'];
export type PriorityLevel = Database['public']['Enums']['priority_level'];
export type WarrantyType = Database['public']['Enums']['warranty_type'];
export type CommentType = Database['public']['Enums']['comment_type'];

// Phase 2 ENUMs
export type TaskStatus = Database['public']['Enums']['task_status'];
export type WarehouseType = Database['public']['Enums']['warehouse_type'];
export type RequestStatus = Database['public']['Enums']['request_status'];
export type ProductCondition = Database['public']['Enums']['product_condition'];
export type ServiceType = Database['public']['Enums']['service_type'];
export type DeliveryMethod = Database['public']['Enums']['delivery_method'];
export type MovementType = Database['public']['Enums']['movement_type'];

// ENUM value constants for use in forms and filters
export const USER_ROLES: UserRole[] = ['admin', 'manager', 'technician', 'reception'];
export const TICKET_STATUSES: TicketStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
export const PRIORITY_LEVELS: PriorityLevel[] = ['low', 'normal', 'high', 'urgent'];
export const WARRANTY_TYPES: WarrantyType[] = ['warranty', 'paid', 'goodwill'];
export const COMMENT_TYPES: CommentType[] = ['note', 'status_change', 'assignment', 'system'];

export const TASK_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed', 'blocked', 'skipped'];
export const WAREHOUSE_TYPES: WarehouseType[] = ['main', 'warranty_stock', 'rma_staging', 'dead_stock', 'in_service', 'parts', 'customer_installed'];
export const REQUEST_STATUSES: RequestStatus[] = ['submitted', 'received', 'processing', 'completed', 'cancelled'];
export const PRODUCT_CONDITIONS: ProductCondition[] = ['new', 'refurbished', 'used', 'faulty', 'for_parts'];
export const SERVICE_TYPES: ServiceType[] = ['warranty', 'paid', 'replacement'];
export const DELIVERY_METHODS: DeliveryMethod[] = ['pickup', 'delivery'];
export const MOVEMENT_TYPES: MovementType[] = ['receipt', 'transfer', 'assignment', 'return', 'disposal'];

// Helper functions for ENUM labels
export const getUserRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    technician: 'Technician',
    reception: 'Reception',
  };
  return labels[role];
};

export const getTicketStatusLabel = (status: TicketStatus): string => {
  const labels: Record<TicketStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status];
};

export const getTaskStatusLabel = (status: TaskStatus): string => {
  const labels: Record<TaskStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    blocked: 'Blocked',
    skipped: 'Skipped',
  };
  return labels[status];
};

export const getWarehouseTypeLabel = (type: WarehouseType): string => {
  const labels: Record<WarehouseType, string> = {
    main: 'Main Storage',
    warranty_stock: 'Warranty Stock',
    rma_staging: 'RMA Staging',
    dead_stock: 'Dead Stock',
    in_service: 'In Service',
    parts: 'Parts',
    customer_installed: 'Customer Installed',
  };
  return labels[type];
};

export const getRequestStatusLabel = (status: RequestStatus): string => {
  const labels: Record<RequestStatus, string> = {
    submitted: 'Submitted',
    pickingup: 'Picking Up',
    received: 'Received',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status];
};

export const getProductConditionLabel = (condition: ProductCondition): string => {
  const labels: Record<ProductCondition, string> = {
    new: 'New',
    refurbished: 'Refurbished',
    used: 'Used',
    faulty: 'Faulty',
    for_parts: 'For Parts',
  };
  return labels[condition];
};

export const getServiceTypeLabel = (type: ServiceType): string => {
  const labels: Record<ServiceType, string> = {
    warranty: 'Warranty Service',
    paid: 'Paid Service',
    replacement: 'Replacement',
  };
  return labels[type];
};

export const getDeliveryMethodLabel = (method: DeliveryMethod): string => {
  const labels: Record<DeliveryMethod, string> = {
    pickup: 'Pickup',
    delivery: 'Delivery',
  };
  return labels[method];
};
