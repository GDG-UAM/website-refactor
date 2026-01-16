import { AbilityBuilder, applyBasePermissions, hasGlobalAdminRole, applyGlobalAdminPermissions, applyUserPermissions } from "@gdg-uam/permissions";
import type { AppAbility, Actions, PermissionUser } from "@gdg-uam/permissions";
import type { SerializablePermission } from "../repositories/types";
import { checkPermission as checkPermissionUtil } from "@gdg-uam/permissions";

/**
 * Define abilities for a user
 * Combines role-based and fine-grained permissions (from session)
 */
export const defineAbilitiesFor = async (
    user: { id: string; role?: string },
    context: Record<string, unknown> = {},
    sessionPermissions: SerializablePermission[] = []
): Promise<AppAbility> => {
    const builder = new AbilityBuilder();

    // Anonymous users have no permissions
    if (!user || !user.id) {
        return builder.build();
    }

    // Build permission user object
    const permUser: PermissionUser = {
        id: user.id,
        role: user.role,
        permissions: sessionPermissions.map((p) => ({
            resource: p.resource,
            actions: p.actions,
            effect: p.effect,
            conditions: p.conditions
        }))
    };

    // 1. Base permissions (every authenticated user)
    applyBasePermissions(builder, user.id);

    // 2. Global role-based permissions
    if (hasGlobalAdminRole(permUser)) {
        applyGlobalAdminPermissions(builder);
        return builder.build();
    }

    // 3. Fine-grained permissions from session
    applyUserPermissions(builder, permUser, context);

    return builder.build();
};

/**
 * Helper function to check permission and throw error if denied
 */
export const checkPermission = (ability: AppAbility, action: Actions, subject: string, data?: Record<string, unknown>): void => {
    checkPermissionUtil(ability, action, subject, data);
};
