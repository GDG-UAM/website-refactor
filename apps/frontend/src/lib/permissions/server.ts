import "server-only";

import { getServerSession } from "#/lib/auth-server";
import { buildAbilityForUser } from "./utils";
import { redirect } from "next/navigation";
import { Actions } from "@gdg-uam/permissions";

/**
 * Server-side protection utility.
 * Ensures the current user has access to a specific section.
 */
export async function ensureSectionAccess(section: string, fallback?: string) {
    const session = await getServerSession();
    const { ability } = buildAbilityForUser(session?.data?.user);

    if (!ability.hasSectionPermissions(section)) {
        redirect(fallback ?? "/");
    }

    return { session, ability };
}

/**
 * Advanced protection utility that recursively finds the first parent
 * path the user has access to.
 */
export async function enforcePathAccess(currentPath: string) {
    const session = await getServerSession();
    const { ability } = buildAbilityForUser(session?.data?.user);

    const fullOriginalPath = currentPath.split("/").filter(Boolean);
    let pathParts = [...fullOriginalPath];
    let attempts = 0;
    const maxAttempts = 10;

    while (pathParts.length > 0 && attempts < maxAttempts) {
        const section = pathParts.join(".");
        if (ability.hasSectionPermissions(section)) {
            if (pathParts.length === fullOriginalPath.length) {
                return { session, ability };
            }
            redirect("/" + pathParts.join("/"));
        }

        pathParts.pop();
        attempts++;
    }

    redirect("/");
}

/**
 * Server-side utility.
 * Checks if the current user has access to a specific section.
 */
export async function hasSectionAccess(section: string) {
    const session = await getServerSession();

    if (session?.data?.user?.role === "admin") {
        return !section.startsWith("adminSectionDenies");
    }

    const { ability } = buildAbilityForUser(session?.data?.user);

    return ability.hasSectionPermissions(section);
}

/**
 * Server-side protection utility for specific actions.
 */
export async function ensurePermission(action: Actions, subject: string, data?: any, fallback?: string) {
    const session = await getServerSession();
    const { ability } = buildAbilityForUser(session?.data?.user);

    if (ability.cannot(action, subject, data)) {
        redirect(fallback ?? "/");
    }

    return { session, ability };
}

/**
 * Server-side utility to check if user can manage a resource.
 * Returns true if user has manage permissions, false otherwise.
 */
export async function canManageResource(resource: string): Promise<boolean> {
    const session = await getServerSession();
    const { ability } = buildAbilityForUser(session?.data?.user);

    return ability.can("manage", resource);
}
