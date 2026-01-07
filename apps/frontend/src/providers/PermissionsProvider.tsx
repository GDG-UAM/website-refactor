"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSession } from "#/providers/SessionProvider";
import type { AppAbility, Actions, PermissionUser } from "@gdg-uam/permissions";
import {
    AbilityBuilder,
    canUser,
    cannotUser,
    applyBasePermissions,
    hasGlobalAdminRole,
    applyGlobalAdminPermissions,
    applyUserPermissions
} from "@gdg-uam/permissions";

type Permission = {
    resource: string;
    actions: Actions[];
    effect: "allow" | "deny";
    conditions?: Record<string, unknown>;
    priority: number;
};

interface PermissionContextType {
    ability: AppAbility;
    permissions: Permission[];
    can: (action: Actions, subject: string, data?: Record<string, unknown>) => boolean;
    cannot: (action: Actions, subject: string, data?: Record<string, unknown>) => boolean;
    loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

interface PermissionProviderProps {
    children: ReactNode;
}

/**
 * Provider component that builds ability from session data
 * and provides permission checking utilities
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
    const { data: session, isPending } = useSession();

    const { ability, permissions } = useMemo(() => {
        const builder = new AbilityBuilder();

        // No user = no permissions
        if (!session?.user) {
            return { ability: builder.build(), permissions: [] };
        }

        const sessionUser = session.user as {
            id: string;
            role?: string;
            individualPermissions?: Permission[];
            templatePermissions?: Permission[];
        };

        // Combine individual and template permissions
        const allPermissions: Permission[] = [];

        if (sessionUser.individualPermissions && Array.isArray(sessionUser.individualPermissions)) {
            allPermissions.push(...sessionUser.individualPermissions);
        }

        if (sessionUser.templatePermissions && Array.isArray(sessionUser.templatePermissions)) {
            allPermissions.push(...sessionUser.templatePermissions);
        }

        // Build permission user object
        const permUser: PermissionUser = {
            id: sessionUser.id,
            role: sessionUser.role,
            permissions: allPermissions
        };

        // Base permissions for authenticated users
        applyBasePermissions(builder, permUser.id);

        // Check for global admin role
        if (hasGlobalAdminRole(permUser)) {
            applyGlobalAdminPermissions(builder);
            return { ability: builder.build(), permissions: allPermissions };
        }

        // Apply user-specific permissions
        applyUserPermissions(builder, permUser, {});

        return { ability: builder.build(), permissions: allPermissions };
    }, [session]);

    const value: PermissionContextType = {
        ability,
        permissions,
        can: (action, subject) => canUser(ability, action, subject),
        cannot: (action, subject) => cannotUser(ability, action, subject),
        loading: isPending
    };

    return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

/**
 * Hook to access permission checking utilities
 * @returns Permission context with ability and helper functions
 */
export function usePermissions(): PermissionContextType {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error("usePermissions must be used within a PermissionProvider");
    }
    return context;
}

/**
 * Hook to check a specific permission
 * @param action - The action to check (create, read, update, delete, manage)
 * @param subject - The subject/resource to check
 * @param data - Optional data to check
 * @returns boolean indicating if the user has permission
 */
export function usePermission(action: Actions, subject: string, data?: Record<string, unknown>): boolean {
    const { can } = usePermissions();
    return can(action, subject, data);
}

/**
 * Hook to check if user has any admin permissions
 * @returns boolean indicating if user has at least one permission starting with "admin."
 */
export function useHasSectionPermissions(section: string): boolean {
    const { permissions } = usePermissions();
    if (!section.endsWith(".")) {
        section += ".";
    }
    return permissions.some((p) => p.resource.startsWith(section) && p.effect === "allow");
}

/**
 * Higher-order component to conditionally render based on permissions
 */
export function withPermission<P extends object>(
    Component: React.ComponentType<P>,
    action: Actions,
    subject: string,
    data?: Record<string, unknown>,
    fallback?: ReactNode
) {
    return function PermissionGuard(props: P) {
        const { cannot } = usePermissions();

        if (cannot(action, subject, data)) {
            return <>{fallback || null}</>;
        }

        return <Component {...props} />;
    };
}
