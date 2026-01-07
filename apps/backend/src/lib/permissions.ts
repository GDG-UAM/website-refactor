import { AbilityBuilder, applyBasePermissions, hasGlobalAdminRole, applyGlobalAdminPermissions, applyUserPermissions } from "@gdg-uam/permissions";
import type { AppAbility, Actions, Subjects, PermissionUser } from "@gdg-uam/permissions";
import type { SerializablePermission } from "../repositories/types";
import { checkPermission as checkPermissionUtil } from "@gdg-uam/permissions";

/**
 * Define abilities for a user
 * Combines role-based and fine-grained permissions (from session)
 */
export const defineAbilitiesFor = async (
    user: { id: string; roles?: string[] },
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
        roles: user.roles,
        permissions: sessionPermissions.map((p) => ({
            resource: p.resource,
            actions: p.actions,
            effect: p.effect,
            conditions: p.conditions,
            priority: p.priority
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
export const checkPermission = (ability: AppAbility, action: Actions, subject: Subjects, field?: string): void => {
    checkPermissionUtil(ability, action, subject, field);
};
