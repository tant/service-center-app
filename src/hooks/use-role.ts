/**
 * useRole Hook
 *
 * React hook for accessing the current user's role and permissions.
 * This hook provides convenient utilities for role-based UI rendering
 * and permission checking.
 *
 * Usage:
 * ```typescript
 * const { role, isAdmin, permissions, hasRole } = useRole();
 *
 * if (isAdmin) {
 *   // Show admin UI
 * }
 *
 * if (permissions?.tickets.create) {
 *   // Show create ticket button
 * }
 * ```
 *
 * Reference: docs/IMPLEMENTATION-GUIDE-ROLES.md Section 3.1
 */

import { trpc } from "@/components/providers/trpc-provider";
import type { Role } from "@/types/roles";
import {
  getRoleDisplayName,
  getRoleDisplayNameVi,
  PERMISSIONS,
  ROLE_HIERARCHY,
} from "@/types/roles";

export function useRole() {
  // Fetch current user profile (includes role)
  const { data: profile, isLoading } = trpc.profile.getCurrentUser.useQuery();

  const role = profile?.role as Role | undefined;

  /**
   * Check if user has a specific role
   * @param requiredRole - The role to check against
   * @returns true if user has the required role or higher
   *
   * @example
   * if (hasRole('manager')) {
   *   // User is manager or admin
   * }
   */
  const hasRole = (requiredRole: Role): boolean => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
  };

  /**
   * Check if user has any of the specified roles
   * @param requiredRoles - Array of roles to check
   * @returns true if user has one of the roles
   *
   * @example
   * if (hasAnyRole(['admin', 'manager'])) {
   *   // User is admin OR manager
   * }
   */
  const hasAnyRole = (requiredRoles: Role[]): boolean => {
    if (!role) return false;
    return requiredRoles.includes(role);
  };

  // Role flags for easy checking
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isTechnician = role === "technician";
  const isReception = role === "reception";

  // Compound checks
  const isManagerOrAbove = hasAnyRole(["admin", "manager"]);
  const isOperationsStaff = hasAnyRole(["admin", "manager", "reception"]);

  // Get permissions for current role
  const permissions = role ? PERMISSIONS[role] : null;

  // Display names
  const displayName = role ? getRoleDisplayName(role) : null;
  const displayNameVi = role ? getRoleDisplayNameVi(role) : null;

  return {
    // Current role
    role,
    isLoading,

    // Role checking functions
    hasRole,
    hasAnyRole,

    // Role flags
    isAdmin,
    isManager,
    isTechnician,
    isReception,

    // Compound checks
    isManagerOrAbove,
    isOperationsStaff,

    // Permissions
    permissions,

    // Display names
    displayName,
    displayNameVi,

    // Profile data
    profile,
  };
}
