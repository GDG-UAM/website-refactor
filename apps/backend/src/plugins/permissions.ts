import { Elysia } from "elysia";
import { auth } from "../lib/auth";
import { defineAbilitiesFor } from "../lib/permissions";
import type { SerializablePermission } from "../repositories";

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
                  role: betterAuthUser.role ?? undefined
              }
            : undefined;

        // Get permissions from user object (stored in Better Auth user document)
        // If not present, fall back to loading from database (for backwards compatibility)
        let sessionPermissions: SerializablePermission[] = [];

        if (betterAuthUser) {
            try {
                // Permissions are stored in individualPermissions and templatePermissions in user document
                const individualPermissions = betterAuthUser.individualPermissions;
                const templatePermissions = betterAuthUser.templatePermissions;

                // Combine individual and template permissions
                const allPermissions: SerializablePermission[] = [];

                if (individualPermissions && Array.isArray(individualPermissions) && individualPermissions.length > 0) {
                    allPermissions.push(...(individualPermissions as SerializablePermission[]));
                }

                if (templatePermissions && Array.isArray(templatePermissions) && templatePermissions.length > 0) {
                    allPermissions.push(...(templatePermissions as SerializablePermission[]));
                }

                sessionPermissions = allPermissions;
            } catch (error) {
                console.error("Failed to load permissions from user object:", error);
                // Continue with empty permissions
                sessionPermissions = [];
            }
        }

        // Define abilities based on user and pre-loaded permissions
        const ability = user ? await defineAbilitiesFor(user, context, sessionPermissions) : await defineAbilitiesFor({ id: "", role: undefined }, context, []);

        return {
            user: betterAuthUser,
            session: session?.session ?? null,
            permissions: sessionPermissions, // Make permissions available to routes and frontend
            ability
        };
    });
