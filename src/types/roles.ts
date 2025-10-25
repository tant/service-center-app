/**
 * Role-Based Access Control (RBAC) Type Definitions
 *
 * This file defines the role hierarchy, permissions, and helper functions
 * for the service center application.
 *
 * Roles:
 * - Admin: Full system access (1 account only)
 * - Manager: Operations oversight, team management, approvals
 * - Technician: Task execution, limited to assigned work
 * - Reception: Customer intake, ticket creation
 *
 * Reference: docs/ROLES-AND-PERMISSIONS.md
 */

// =====================================================
// ROLE DEFINITIONS
// =====================================================

export const ROLES = {
	ADMIN: "admin",
	MANAGER: "manager",
	TECHNICIAN: "technician",
	RECEPTION: "reception",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// =====================================================
// ROLE HIERARCHY
// =====================================================

/**
 * Numeric hierarchy for role comparison
 * Higher number = more privileged
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
	admin: 4,
	manager: 3,
	technician: 2,
	reception: 1,
};

/**
 * Check if a user's role is at or above a required role
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if user has sufficient privileges
 *
 * @example
 * hasHigherRole('manager', 'technician') // true
 * hasHigherRole('technician', 'manager') // false
 */
export function hasHigherRole(userRole: Role, requiredRole: Role): boolean {
	return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// =====================================================
// PERMISSION DEFINITIONS
// =====================================================

export interface RolePermissions {
	tickets: {
		viewAll: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
		assignTechnician: boolean;
		switchTemplate: boolean;
	};
	customers: {
		viewAll: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	products: {
		viewCatalog: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	warehouse: {
		viewStock: boolean;
		createMovement: boolean;
		createRMA: boolean;
	};
	team: {
		viewAll: boolean;
		createUser: boolean;
		updateUser: boolean;
		deleteUser: boolean;
	};
	reports: {
		viewAll: boolean;
		exportData: boolean;
	};
	templates: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
}

/**
 * Complete permission matrix for all roles
 *
 * Reference: docs/ROLES-AND-PERMISSIONS.md Section 3
 */
export const PERMISSIONS: Record<Role, RolePermissions> = {
	admin: {
		tickets: {
			viewAll: true,
			create: true,
			update: true,
			delete: true,
			assignTechnician: true,
			switchTemplate: true,
		},
		customers: {
			viewAll: true,
			create: true,
			update: true,
			delete: true,
		},
		products: {
			viewCatalog: true,
			create: true,
			update: true,
			delete: true,
		},
		warehouse: {
			viewStock: true,
			createMovement: true,
			createRMA: true,
		},
		team: {
			viewAll: true,
			createUser: true,
			updateUser: true,
			deleteUser: true,
		},
		reports: {
			viewAll: true,
			exportData: true,
		},
		templates: {
			view: true,
			create: true,
			update: true,
			delete: true,
		},
	},
	manager: {
		tickets: {
			viewAll: true,
			create: true,
			update: true,
			delete: false, // Can cancel but not delete
			assignTechnician: true,
			switchTemplate: true, // With audit trail
		},
		customers: {
			viewAll: true,
			create: true,
			update: true,
			delete: false,
		},
		products: {
			viewCatalog: true,
			create: true,
			update: true,
			delete: false,
		},
		warehouse: {
			viewStock: true,
			createMovement: true,
			createRMA: true,
		},
		team: {
			viewAll: true,
			createUser: false, // Only admin can create users
			updateUser: false,
			deleteUser: false,
		},
		reports: {
			viewAll: true,
			exportData: true,
		},
		templates: {
			view: true,
			create: true,
			update: true,
			delete: false,
		},
	},
	technician: {
		tickets: {
			viewAll: false, // Only assigned tickets
			create: false,
			update: false, // Can update tasks, not tickets
			delete: false,
			assignTechnician: false,
			switchTemplate: false,
		},
		customers: {
			viewAll: false, // Only customers from assigned tickets
			create: false,
			update: false,
			delete: false,
		},
		products: {
			viewCatalog: true, // Read-only
			create: false,
			update: false,
			delete: false,
		},
		warehouse: {
			viewStock: true, // Read-only
			createMovement: false,
			createRMA: false,
		},
		team: {
			viewAll: false,
			createUser: false,
			updateUser: false,
			deleteUser: false,
		},
		reports: {
			viewAll: false, // No analytics/revenue data
			exportData: false,
		},
		templates: {
			view: false,
			create: false,
			update: false,
			delete: false,
		},
	},
	reception: {
		tickets: {
			viewAll: true, // Can see all tickets to answer customer questions
			create: true,
			update: false, // Only basic info during creation
			delete: false,
			assignTechnician: false, // Auto-assign or manager does it
			switchTemplate: false,
		},
		customers: {
			viewAll: true,
			create: true,
			update: true,
			delete: false,
		},
		products: {
			viewCatalog: true, // For warranty checks
			create: false,
			update: false,
			delete: false,
		},
		warehouse: {
			viewStock: false,
			createMovement: false,
			createRMA: false,
		},
		team: {
			viewAll: false,
			createUser: false,
			updateUser: false,
			deleteUser: false,
		},
		reports: {
			viewAll: false,
			exportData: false,
		},
		templates: {
			view: false,
			create: false,
			update: false,
			delete: false,
		},
	},
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get permissions for a specific role
 * @param role - The role to get permissions for
 * @returns Complete permission set for the role
 */
export function getPermissionsForRole(role: Role): RolePermissions {
	return PERMISSIONS[role];
}

/**
 * Check if a role has a specific permission
 * @param role - The role to check
 * @param category - Permission category (e.g., 'tickets', 'customers')
 * @param action - Specific action (e.g., 'create', 'viewAll')
 * @returns true if role has the permission
 *
 * @example
 * hasPermission('technician', 'tickets', 'create') // false
 * hasPermission('manager', 'tickets', 'create') // true
 */
export function hasPermission(
	role: Role,
	category: keyof RolePermissions,
	action: string,
): boolean {
	const permissions = PERMISSIONS[role];
	const categoryPerms = permissions[category] as Record<string, boolean>;
	return categoryPerms[action] ?? false;
}

/**
 * Get human-readable role name
 * @param role - The role enum value
 * @returns Display name for the role
 */
export function getRoleDisplayName(role: Role): string {
	const displayNames: Record<Role, string> = {
		admin: "Administrator",
		manager: "Manager",
		technician: "Technician",
		reception: "Reception",
	};
	return displayNames[role];
}

/**
 * Get Vietnamese role name
 * @param role - The role enum value
 * @returns Vietnamese display name
 */
export function getRoleDisplayNameVi(role: Role): string {
	const displayNamesVi: Record<Role, string> = {
		admin: "Quản trị viên",
		manager: "Quản lý",
		technician: "Kỹ thuật viên",
		reception: "Lễ tân",
	};
	return displayNamesVi[role];
}

// =====================================================
// AUDIT TRAIL REQUIREMENTS
// =====================================================

/**
 * Actions that require audit trail with reason
 */
export const AUDITED_ACTIONS = [
	"template_switch",
	"role_change",
	"stock_movement",
	"rma_create",
	"high_value_approval",
] as const;

export type AuditedAction = (typeof AUDITED_ACTIONS)[number];

/**
 * Minimum reason length for audited actions
 */
export const MIN_AUDIT_REASON_LENGTH = 10;

/**
 * Check if an action requires audit trail
 * @param action - The action to check
 * @returns true if action requires audit logging with reason
 */
export function requiresAudit(action: string): action is AuditedAction {
	return AUDITED_ACTIONS.includes(action as AuditedAction);
}
