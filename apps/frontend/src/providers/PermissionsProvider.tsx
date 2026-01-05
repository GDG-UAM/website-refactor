"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSession } from "#/providers/SessionProvider";
import type { AppAbility, Actions, Subjects } from "@gdg-uam/permissions";
import { AbilityBuilder, canUser, cannotUser } from "@gdg-uam/permissions";

interface PermissionContextType {
    ability: AppAbility;
    permissions: Array<{
        resource: string;
        actions: Actions[];
        effect: "allow" | "deny";
        conditions?: Record<string, unknown>;
        priority: number;
    }>;
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

        const user = session.user as {
            roles?: string;
            permissions?: Array<{
                resource: string;
                actions: Actions[];
                effect: "allow" | "deny";
                conditions?: Record<string, unknown>;
                priority: number;
            }>;
        };

        // Base permissions for authenticated users
        builder.can("read", "User");
        builder.can("update", "User");

        // Check for global admin role
        const roles = user.roles ? user.roles.split(",").map((r: string) => r.trim()) : [];
        if (roles.includes("admin")) {
            builder.can("manage", "all");
            return { ability: builder.build(), permissions: [] };
        }

        // Parse permissions from user object (stored as JSON object)
        let userPermissions: Array<{
            resource: string;
            actions: Actions[];
            effect: "allow" | "deny";
            conditions?: Record<string, unknown>;
            priority: number;
        }> = [];

        try {
            if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
                userPermissions = user.permissions;
            }
        } catch (error) {
            console.error("Failed to load permissions from user object:", error);
        }

        // Build ability from user's fine-grained permissions
        const sorted = [...userPermissions].sort((a, b) => b.priority - a.priority);
        for (const perm of sorted) {
            const method = perm.effect === "deny" ? builder.cannot.bind(builder) : builder.can.bind(builder);
            for (const action of perm.actions) {
                method(action, perm.resource, perm.conditions);
            }
        }

        return { ability: builder.build(), permissions: userPermissions };
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
