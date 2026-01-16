import {
    AbilityBuilder,
    applyBasePermissions,
    hasGlobalAdminRole,
    applyGlobalAdminPermissions,
    applyUserPermissions,
    AppAbility,
    PermissionUser,
    Actions
} from "@gdg-uam/permissions";

export type Permission = {
    resource: string;
    actions: Actions[];
    effect: "allow" | "deny";
    conditions?: Record<string, unknown>;
};

/**
 * Shared utility to build user ability from session data.
 * Works on both client and server.
 */
export function buildAbilityForUser(user: any): { ability: AppAbility; permissions: Permission[] } {
    const builder = new AbilityBuilder();

    if (!user) {
        return { ability: builder.build(), permissions: [] };
    }

    const sessionUser = user as {
        id: string;
        role?: string;
        individualPermissions?: Permission[];
        templatePermissions?: Permission[];
    };

    const allPermissions: Permission[] = [];

    if (sessionUser.individualPermissions && Array.isArray(sessionUser.individualPermissions)) {
        allPermissions.push(...sessionUser.individualPermissions);
    }

    if (sessionUser.templatePermissions && Array.isArray(sessionUser.templatePermissions)) {
        allPermissions.push(...sessionUser.templatePermissions);
    }

    const permUser: PermissionUser = {
        id: sessionUser.id,
        role: sessionUser.role,
        permissions: allPermissions
    };

    applyBasePermissions(builder, permUser.id);

    if (hasGlobalAdminRole(permUser)) {
        applyGlobalAdminPermissions(builder);
        return { ability: builder.build(), permissions: allPermissions };
    }

    applyUserPermissions(builder, permUser, {});

    return { ability: builder.build(), permissions: allPermissions };
}
