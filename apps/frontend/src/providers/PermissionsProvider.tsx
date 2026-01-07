"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSession } from "#/providers/SessionProvider";
import type { AppAbility, Actions, Subjects, PermissionUser } from "@gdg-uam/permissions";
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
    can: (action: Actions, subject: Subjects, field?: string) => boolean;
    cannot: (action: Actions, subject: Subjects, field?: string) => boolean;
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
            permissions?: Permission[];
        };

        // Build permission user object
        const permUser: PermissionUser = {
            id: sessionUser.id,
            role: sessionUser.role,
            permissions: sessionUser.permissions
        };

        // Base permissions for authenticated users
        applyBasePermissions(builder, permUser.id);

        // Check for global admin role
        if (hasGlobalAdminRole(permUser)) {
            applyGlobalAdminPermissions(builder);
            return { ability: builder.build(), permissions: permUser.permissions || [] };
        }

        // Apply user-specific permissions
        applyUserPermissions(builder, permUser, {});

        return { ability: builder.build(), permissions: permUser.permissions || [] };
    }, [session]);

    const value: PermissionContextType = {
        ability,
        permissions,
        can: (action, subject, field) => canUser(ability, action, subject, field),
        cannot: (action, subject, field) => cannotUser(ability, action, subject, field),
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
 * @param field - Optional field to check
 * @returns boolean indicating if the user has permission
 */
export function usePermission(action: Actions, subject: Subjects, field?: string): boolean {
    const { can } = usePermissions();
    return can(action, subject, field);
}

/**
 * Hook to check if user has any admin permissions
 * @returns boolean indicating if user has at least one permission starting with "admin."
 */
export function useHasAdminPermissions(): boolean {
    const { permissions } = usePermissions();
    return permissions.some((p) => p.resource.startsWith("admin.") && p.effect === "allow");
}

/**
 * Higher-order component to conditionally render based on permissions
 */
export function withPermission<P extends object>(Component: React.ComponentType<P>, action: Actions, subject: Subjects, fallback?: ReactNode) {
    return function PermissionGuard(props: P) {
        const { can } = usePermissions();

        if (!can(action, subject)) {
            return <>{fallback || null}</>;
        }

        return <Component {...props} />;
    };
}
