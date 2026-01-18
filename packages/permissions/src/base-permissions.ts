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
    }>;
}

/**
 * Apply base permissions that all authenticated users should have
 * These are global permissions automatically granted to any logged-in user
 */
export function applyBasePermissions(builder: AbilityBuilder, userId: string): void {
    builder.can("read", `users.${userId}`);

    // Users can read their own events (regardless of status)
    builder.can("read", "events.*", { createdBy: userId });
    builder.can("read", "articles.newsletter.*", { createdBy: userId });
    builder.can("read", "articles.blog.*", { createdBy: userId });
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
    builder.cannot("delete", "permissiontemplates.*", { name: { $in: ["role:team", "role:organizer"] } });
}

/**
 * Apply user-specific fine-grained permissions
 */
export function applyUserPermissions(builder: AbilityBuilder, user: PermissionUser, context: Record<string, unknown> = {}): void {
    if (!user.permissions || user.permissions.length === 0) {
        return;
    }

    for (const perm of user.permissions) {
        const method = perm.effect === "deny" ? builder.cannot.bind(builder) : builder.can.bind(builder);

        // Evaluate conditions with context (replaces {user.id}, etc.)
        const evaluatedConditions = evaluateConditions(perm.conditions, { user, ...context });

        for (const action of perm.actions) {
            method(action, perm.resource, evaluatedConditions);
        }
    }
}
