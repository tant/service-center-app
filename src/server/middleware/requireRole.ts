/**
 * Role-Based Access Control Middleware for tRPC
 *
 * This middleware checks if the authenticated user has the required role
 * before allowing the procedure to execute.
 *
 * Usage:
 * ```typescript
 * export const ticketsRouter = router({
 *   list: publicProcedure
 *     .use(requireRole(['admin', 'manager', 'reception']))
 *     .query(async ({ ctx }) => {
 *       // Only accessible by admin, manager, or reception
 *     }),
 * });
 * ```
 *
 * Reference: docs/IMPLEMENTATION-GUIDE-ROLES.md Section 2.2
 */

import { TRPCError } from "@trpc/server";
import type { Role } from "@/types/roles";
import type { TRPCContext } from "../trpc";
import { middleware } from "../trpc";

// =====================================================
// EXTENDED CONTEXT TYPE WITH ROLE
// =====================================================

export interface RoleContext extends TRPCContext {
  userRole: Role;
}

// =====================================================
// MAIN MIDDLEWARE: REQUIRE ROLE
// =====================================================

/**
 * Middleware that checks if the user has one of the required roles
 *
 * @param allowedRoles - Array of roles that are allowed to access this procedure
 * @returns Middleware that adds userRole to context
 * @throws UNAUTHORIZED if user is not logged in
 * @throws FORBIDDEN if user doesn't have required role
 * @throws INTERNAL_SERVER_ERROR if profile lookup fails
 *
 * @example
 * // Allow only admin and manager
 * .use(requireRole(['admin', 'manager']))
 *
 * // Allow only technician
 * .use(requireRole(['technician']))
 */
export const requireRole = (allowedRoles: Role[]) => {
  return middleware(async ({ ctx, next }) => {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    // Get user profile with role from database
    const { data: profile, error } = await ctx.supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", ctx.user.id)
      .single();

    if (error || !profile) {
      console.error(
        `[RBAC] Failed to fetch profile for user ${ctx.user.id}:`,
        error,
      );
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user profile",
      });
    }

    const userRole = profile.role as Role;

    // Check if user has required role
    if (!allowedRoles.includes(userRole)) {
      console.warn(
        `[RBAC] User ${ctx.user.email} (${userRole}) attempted to access ${allowedRoles.join(", ")} only resource`,
      );
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires one of these roles: ${allowedRoles.join(", ")}. Your role: ${userRole}`,
      });
    }

    console.log(
      `✅ [RBAC] User ${ctx.user.email} (${userRole}) authorized for roles: ${allowedRoles.join(", ")}`,
    );

    // Add userRole to context for use in procedures
    return next({
      ctx: {
        ...ctx,
        userRole,
      },
    });
  });
};

// =====================================================
// CONVENIENCE MIDDLEWARES
// =====================================================

/**
 * Middleware that requires admin role
 * @example .use(requireAdmin)
 */
export const requireAdmin = requireRole(["admin"]);

/**
 * Middleware that requires admin or manager role
 * @example .use(requireManagerOrAbove)
 */
export const requireManagerOrAbove = requireRole(["admin", "manager"]);

/**
 * Middleware that requires technician role (or above)
 * @example .use(requireTechnician)
 */
export const requireTechnician = requireRole([
  "admin",
  "manager",
  "technician",
]);

/**
 * Middleware that requires any authenticated user
 * @example .use(requireAnyAuthenticated)
 */
export const requireAnyAuthenticated = requireRole([
  "admin",
  "manager",
  "technician",
  "reception",
]);

/**
 * Middleware that requires operations staff (admin, manager, reception)
 * Useful for ticket creation endpoints
 * @example .use(requireOperationsStaff)
 */
export const requireOperationsStaff = requireRole([
  "admin",
  "manager",
  "reception",
]);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if user has a specific role (for use in procedures)
 *
 * @param ctx - tRPC context
 * @param role - Role to check
 * @returns true if user has the role
 *
 * @example
 * ```typescript
 * if (await hasRole(ctx, 'admin')) {
 *   // Admin-specific logic
 * }
 * ```
 */
export async function hasRole(ctx: TRPCContext, role: Role): Promise<boolean> {
  if (!ctx.user) return false;

  const { data: profile } = await ctx.supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", ctx.user.id)
    .single();

  return profile?.role === role;
}

/**
 * Get user's role (for use in procedures)
 *
 * @param ctx - tRPC context
 * @returns User's role or null if not found
 *
 * @example
 * ```typescript
 * const userRole = await getUserRole(ctx);
 * if (userRole === 'technician') {
 *   // Technician-specific logic
 * }
 * ```
 */
export async function getUserRole(ctx: TRPCContext): Promise<Role | null> {
  if (!ctx.user) return null;

  const { data: profile } = await ctx.supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", ctx.user.id)
    .single();

  return (profile?.role as Role) || null;
}
