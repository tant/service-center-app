import {
  IconKey,
  IconShield,
  IconTool,
  IconUser,
  IconUserCheck,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

export type UserRole = "admin" | "manager" | "technician" | "reception";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  technician: "Kỹ thuật viên",
  reception: "Lễ tân",
} as const;

export const ROLE_ICONS: Record<
  UserRole,
  ComponentType<{ className?: string }>
> = {
  admin: IconShield,
  manager: IconUserCheck,
  technician: IconTool,
  reception: IconUser,
} as const;

export const ROLE_COLORS: Record<UserRole, string> = {
  admin:
    "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  manager:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  technician:
    "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  reception:
    "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
} as const;

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function getRoleIcon(role: UserRole) {
  return ROLE_ICONS[role];
}

export function getRoleColor(role: UserRole): string {
  return ROLE_COLORS[role];
}
