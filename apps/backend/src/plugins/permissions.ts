import { Elysia } from "elysia";
import { auth } from "../lib/auth";
import { defineAbilitiesFor } from "../lib/permissions";

export const permissionsPlugin = (app: Elysia) =>
    app.derive(async ({ request }) => {
        // Get session from Better Auth
        const session = await auth.api.getSession({
            headers: request.headers
        });

        const user = session?.user ?? null;

        // Get active organization for the user
        let activeOrganization = null;
        if (user) {
            try {
                const orgs = await auth.api.listOrganizations({
                    headers: request.headers
                });

                // Get the active organization (could be stored in session or header)
                // For now, we'll use the first one or check a header
                const orgId = request.headers.get("x-organization-id");

                if (orgId && orgs) {
                    activeOrganization = orgs.find((org) => org.id === orgId);
                } else if (orgs && orgs.length > 0) {
                    // Default to first organization
                    activeOrganization = orgs[0];
                }
            } catch {
                // No organizations or error fetching
            }
        }

        // Define abilities based on user and active organization
        const ability = defineAbilitiesFor(user, activeOrganization);

        return {
            user,
            session: session?.session ?? null,
            activeOrganization,
            ability
        };
    });
