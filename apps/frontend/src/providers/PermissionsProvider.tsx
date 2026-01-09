"use client";

import { createContext, useContext, useMemo, ReactNode, useEffect } from "react";
import { useSession } from "#/providers/SessionProvider";
import { useRouter } from "next/navigation";
import type { AppAbility, Actions } from "@gdg-uam/permissions";
import { canUser, cannotUser } from "@gdg-uam/permissions";
import { buildAbilityForUser, Permission } from "#/lib/permissions/utils";

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
        return buildAbilityForUser(session?.user);
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
    const { ability } = usePermissions();
    return ability.hasSectionPermissions(section);
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

/**
 * Component to conditionally render children based on section access
 */
export function SectionGuard({ section, children }: { section: string; children: ReactNode }) {
    const hasAccess = useHasSectionPermissions(section);
    const router = useRouter();

    useEffect(() => {
        if (!hasAccess) {
            router.push("/");
        }
    }, [hasAccess, router]);

    if (!hasAccess) return null;

    return <>{children}</>;
}

/**
 * Higher-order component to conditionally render based on section access
 */
export function withSectionAccess<P extends object>(Component: React.ComponentType<P>, section: string) {
    return function PermissionGuard(props: P) {
        return (
            <SectionGuard section={section}>
                <Component {...props} />
            </SectionGuard>
        );
    };
}
