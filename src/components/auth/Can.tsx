'use client';

import { useRole } from '@/hooks/use-role';
import type { Role } from '@/types/roles';

interface CanProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Can Component
 *
 * Conditionally renders children based on user's role.
 * Useful for showing/hiding UI elements based on permissions.
 *
 * @example Simple usage
 * ```tsx
 * <Can roles={['admin', 'manager']}>
 *   <Button>Delete User</Button>
 * </Can>
 * ```
 *
 * @example With fallback
 * ```tsx
 * <Can
 *   roles={['admin']}
 *   fallback={<p>You need admin access</p>}
 * >
 *   <AdminControls />
 * </Can>
 * ```
 *
 * @example Using permission checks
 * ```tsx
 * const { permissions } = useRole();
 *
 * {permissions?.tickets.create && (
 *   <Button>Create Ticket</Button>
 * )}
 * ```
 */
export function Can({ roles, children, fallback = null }: CanProps) {
  const { hasAnyRole, isLoading } = useRole();

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // User doesn't have required role
  if (!hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  // User has permission
  return <>{children}</>;
}

/**
 * CanNot Component
 *
 * Inverse of Can - renders children when user does NOT have the specified roles.
 * Useful for showing different UI for users without certain permissions.
 *
 * @example
 * ```tsx
 * <CanNot roles={['admin']}>
 *   <p>Contact an administrator for access</p>
 * </CanNot>
 * ```
 */
export function CanNot({ roles, children, fallback = null }: CanProps) {
  const { hasAnyRole, isLoading } = useRole();

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // User HAS the role - show fallback
  if (hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  // User doesn't have the role - show children
  return <>{children}</>;
}
