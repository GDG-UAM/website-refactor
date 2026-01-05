import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { checkPermission } from "../../lib/permissions";
import { permissionsPlugin } from "../../plugins/permissions";
import { ActionsSchema } from "../../repositories/types";

export const permissionRoutes = new Elysia({ prefix: "/permissions" })
    .use(permissionsPlugin)
    // Apply template to user
    .post(
        "/apply-template",
        async ({ body, user, ability, set }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            try {
                checkPermission(ability, "manage", "User"); // Admin-only

                const { permissionRepository } = db.getRepositories();
                const permissions = await permissionRepository.applyTemplate({
                    userId: body.userId,
                    templateId: body.templateId,
                    bindings: body.bindings,
                    conditions: body.conditions,
                    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
                    grantedBy: user.id,
                    reason: body.reason
                });

                return {
                    success: true,
                    permissions,
                    message: `Applied template to user, created ${permissions.length} permissions`
                };
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                set.status = message.includes("Forbidden") ? 403 : 400;
                return { error: message };
            }
        },
        {
            body: t.Object({
                userId: t.String(),
                templateId: t.String(),
                bindings: t.Record(t.String(), t.String()),
                conditions: t.Optional(t.Record(t.String(), t.Any())),
                expiresAt: t.Optional(t.String()),
                reason: t.Optional(t.String())
            })
        }
    )

    // List user permissions
    .get(
        "/user/:userId",
        async ({ params, user, ability, set, query }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            try {
                // Users can view their own permissions, admins can view anyone's
                if (params.userId !== user.id) {
                    checkPermission(ability, "read", "User");
                }

                const { permissionRepository } = db.getRepositories();
                const permissions = await permissionRepository.findByUserId(params.userId);

                // Filter by resource if provided
                if (query.resource) {
                    const filtered = permissions.filter((p) => p.resource.startsWith(query.resource!));
                    return { permissions: filtered };
                }

                return { permissions };
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                set.status = message.includes("Forbidden") ? 403 : 400;
                return { error: message };
            }
        },
        {
            params: t.Object({
                userId: t.String()
            }),
            query: t.Object({
                resource: t.Optional(t.String())
            })
        }
    )

    // Check permission
    .post(
        "/check",
        async ({ body, user, set }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            try {
                // Check own permissions or admin checking others
                const targetUserId = body.userId || user.id;

                const { permissionRepository } = db.getRepositories();
                const result = await permissionRepository.checkPermission(targetUserId, body.action, body.resource, body.context);

                return result;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                set.status = 400;
                return { error: message };
            }
        },
        {
            body: t.Object({
                userId: t.Optional(t.String()),
                action: ActionsSchema,
                resource: t.String(),
                context: t.Optional(t.Record(t.String(), t.Any()))
            })
        }
    )

    // Revoke permission
    .delete(
        "/:id",
        async ({ params, user, ability, set }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            try {
                checkPermission(ability, "delete", "User"); // Admin-only

                const { permissionRepository } = db.getRepositories();
                const success = await permissionRepository.deleteById(params.id);

                if (!success) {
                    set.status = 404;
                    return { error: "Permission not found" };
                }

                return {
                    success: true,
                    message: "Permission revoked successfully"
                };
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                set.status = message.includes("Forbidden") ? 403 : 400;
                return { error: message };
            }
        },
        {
            params: t.Object({
                id: t.String()
            })
        }
    )

    // Revoke all permissions from a template
    .delete(
        "/template/:templateId/user/:userId",
        async ({ params, user, ability, set }) => {
            if (!user) {
                set.status = 401;
                return { error: "Not logged in" };
            }

            try {
                checkPermission(ability, "delete", "User");

                const { permissionRepository } = db.getRepositories();
                const count = await permissionRepository.revokeByTemplate(params.userId, params.templateId);

                return {
                    success: true,
                    message: `Revoked ${count} permissions`,
                    count
                };
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";
                set.status = message.includes("Forbidden") ? 403 : 400;
                return { error: message };
            }
        },
        {
            params: t.Object({
                templateId: t.String(),
                userId: t.String()
            })
        }
    );
