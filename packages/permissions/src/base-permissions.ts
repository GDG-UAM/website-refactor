import type { AbilityBuilder, Actions } from "./types";
import { evaluateConditions } from "./utils";

/**
 * User object structure for permission system
 */
export interface PermissionUser {
    id: string;
    role?: string;
    permissions?: Array<{
        resource: string;
        actions: Actions[];
        effect: "allow" | "deny";
        conditions?: Record<string, unknown>;
        priority: number;
    }>;
}

/**
 * Apply base permissions that all authenticated users should have
 * These are global permissions automatically granted to any logged-in user
 */
export function applyBasePermissions(builder: AbilityBuilder, userId: string): void {
    builder.can("read", `users.${userId}`);
}

/**
 * Check if user has global admin role
 */
export function hasGlobalAdminRole(user: PermissionUser): boolean {
    // Check single role string (comma-separated)
    return user.role === "admin";
}

/**
 * Apply global admin permissions
 */
export function applyGlobalAdminPermissions(builder: AbilityBuilder): void {
    builder.can("manage", "all");
}

/**
 * Apply user-specific fine-grained permissions
 */
export function applyUserPermissions(builder: AbilityBuilder, user: PermissionUser, context: Record<string, unknown> = {}): void {
    if (!user.permissions || user.permissions.length === 0) {
        return;
    }

    // Sort by priority (higher priority first)
    const sorted = [...user.permissions].sort((a, b) => b.priority - a.priority);

    for (const perm of sorted) {
        const method = perm.effect === "deny" ? builder.cannot.bind(builder) : builder.can.bind(builder);

        // Evaluate conditions with context (replaces {user.id}, etc.)
        const evaluatedConditions = evaluateConditions(perm.conditions, { user, ...context });

        for (const action of perm.actions) {
            method(action, perm.resource, evaluatedConditions);
        }
    }
}
