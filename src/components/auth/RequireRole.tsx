'use client';

import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import type { Role } from '@/types/roles';
import { useEffect } from 'react';

interface RequireRoleProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * RequireRole Component
 *
 * Protects routes by checking if the user has one of the allowed roles.
 * If the user doesn't have permission, redirects to unauthorized page or shows fallback.
 *
 * @example
 * ```tsx
 * <RequireRole allowedRoles={['admin', 'manager']}>
 *   <AdminPanel />
 * </RequireRole>
 * ```
 *
 * @example With custom redirect
 * ```tsx
 * <RequireRole
 *   allowedRoles={['admin']}
 *   redirectTo="/dashboard"
 * >
 *   <AdminSettings />
 * </RequireRole>
 * ```
 */
export function RequireRole({
  allowedRoles,
  children,
  fallback = null,
  redirectTo = '/unauthorized'
}: RequireRoleProps) {
  const { role, isLoading, hasAnyRole } = useRole();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after loading is complete and user doesn't have permission
    if (!isLoading && role && !hasAnyRole(allowedRoles)) {
      router.push(redirectTo);
    }
  }, [isLoading, role, allowedRoles, hasAnyRole, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-muted-foreground">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  // No role means user is not authenticated
  if (!role) {
    return fallback ? fallback : null;
  }

  // User doesn't have required role
  if (!hasAnyRole(allowedRoles)) {
    return fallback ? fallback : null;
  }

  // User has permission
  return <>{children}</>;
}
