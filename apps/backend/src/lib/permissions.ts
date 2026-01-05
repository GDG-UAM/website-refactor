import { AbilityBuilder } from "@gdg-uam/permissions";
import type { AppAbility, Actions, Subjects } from "@gdg-uam/permissions";
import type { SerializablePermission } from "../repositories/types";
import { checkPermission as checkPermissionUtil } from "@gdg-uam/permissions";
import db from "./db";

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

    // 1. Base permissions (every authenticated user)
    // Users can read and update their own profile
    builder.can("read", "User");
    builder.can("update", "User");

    // 2. Global role-based permissions
    // Check if user has global admin role (from Better Auth extended schema)
    if (user.roles?.includes("admin")) {
        // Global admins can manage everything
        builder.can("manage", "all");
        return builder.build();
    }

    // 3. Fine-grained permissions from session (pre-loaded, no DB query!)
    if (sessionPermissions.length > 0) {
        // Build context for permission evaluation
        const permissionContext = {
            user,
            ...context
        };

        // Build ability from session permissions (no database query)
        const { permissionRepository } = db.getRepositories();
        const dbAbility = permissionRepository.buildAbilityFromPermissions(sessionPermissions, permissionContext);

        // Merge session permissions with role-based permissions
        // Session permissions take precedence (especially deny rules)
        const dbRules = dbAbility.getRules();
        for (const rule of dbRules) {
            if (rule.inverted) {
                builder.cannot(rule.action, rule.subject, rule.conditions);
            } else {
                builder.can(rule.action, rule.subject, rule.conditions);
            }
        }
    }

    return builder.build();
};

/**
 * Helper function to check permission and throw error if denied
 */
export const checkPermission = (ability: AppAbility, action: Actions, subject: Subjects, field?: string): void => {
    checkPermissionUtil(ability, action, subject, field);
};
