import { Elysia } from "elysia";
import { auth } from "../lib/auth";
import { defineAbilitiesFor } from "../lib/permissions";
import db from "../lib/db";
import type { Actions } from "@gdg-uam/permissions";

export const permissionsPlugin = (app: Elysia) =>
    app.derive(async ({ request }) => {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        const betterAuthUser = session?.user;

        // Build context for permission evaluation
        const url = new URL(request.url);
        const context = {
            request,
            headers: Object.fromEntries(request.headers.entries()),
            query: Object.fromEntries(url.searchParams.entries()),
            path: url.pathname
        };

        // Transform Better Auth user to permission system format
        const user = betterAuthUser
            ? {
                  id: betterAuthUser.id,
                  roles: betterAuthUser.role ? betterAuthUser.role.split(",").map((r) => r.trim()) : []
              }
            : undefined;

        // Get permissions from user object (stored in Better Auth user document)
        // If not present, fall back to loading from database (for backwards compatibility)
        let sessionPermissions: Array<{
            resource: string;
            actions: Actions[];
            effect: "allow" | "deny";
            conditions?: Record<string, unknown>;
            priority: number;
        }> = [];

        if (betterAuthUser) {
            try {
                // Permissions are stored as JSON object in user document
                const permissions = betterAuthUser.permissions;
                if (permissions && Array.isArray(permissions) && permissions.length > 0) {
                    sessionPermissions = permissions as Array<{
                        resource: string;
                        actions: Actions[];
                        effect: "allow" | "deny";
                        conditions?: Record<string, unknown>;
                        priority: number;
                    }>;
                } else {
                    // No permissions in user object, load from database and sync
                    try {
                        const { permissionRepository } = db.getRepositories();
                        sessionPermissions = await permissionRepository.getUserPermissions(betterAuthUser.id);
                        // Sync to user document for next time (don't await to avoid blocking)
                        permissionRepository.syncPermissionsToUser(betterAuthUser.id).catch((err) => {
                            console.error("Failed to sync permissions to user:", err);
                        });
                    } catch (dbError) {
                        console.error("Failed to load permissions from database:", dbError);
                        // Continue with empty permissions - better than blocking the request
                    }
                }
            } catch (error) {
                // If parsing fails, load from database
                console.error("Failed to load permissions from user object:", error);
                try {
                    const { permissionRepository } = db.getRepositories();
                    sessionPermissions = await permissionRepository.getUserPermissions(betterAuthUser.id);
                } catch (dbError) {
                    console.error("Failed to load permissions from database:", dbError);
                    // Continue with empty permissions
                }
            }
        }

        // Define abilities based on user and pre-loaded permissions
        const ability = user ? await defineAbilitiesFor(user, context, sessionPermissions) : await defineAbilitiesFor({ id: "", roles: [] }, context, []);

        return {
            user: betterAuthUser,
            session: session?.session ?? null,
            permissions: sessionPermissions, // Make permissions available to routes and frontend
            ability
        };
    });
