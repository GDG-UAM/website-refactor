import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import { PermissionTemplateSchema } from "../../repositories/types";

const AdminPermissionTemplateResponseSchema = t.Object({
    _id: t.String(),
    name: t.String(),
    description: t.Optional(t.String()),
    permissions: t.Array(
        t.Object({
            resource: t.String(),
            actions: t.Array(t.String()),
            effect: t.Union([t.Literal("allow"), t.Literal("deny")]),
            conditions: t.Optional(t.Record(t.String(), t.Any()))
        })
    ),
    isActive: t.Boolean(),
    createdAt: t.Union([t.Date(), t.String()]),
    updatedAt: t.Union([t.Date(), t.String()])
});

export const adminPermissionsRoutes = new Elysia({ prefix: "/permissions" })
    .use(permissionsPlugin)
    .get(
        "/",
        async ({ ability, set }) => {
            if (ability.cannot("read", "admin.permissions")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { permissionRepository } = db.getRepositories();
            const templates = await permissionRepository.findTemplates({ includeInactive: true });

            return templates.map((t) => ({
                ...t,
                _id: t._id?.toString() as string,
                createdAt: t.createdAt || new Date(),
                updatedAt: t.updatedAt || new Date()
            }));
        },
        {
            response: {
                200: t.Array(AdminPermissionTemplateResponseSchema),
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Permissions"]
            }
        }
    )
    .get(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("read", `admin.permissions.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { permissionRepository } = db.getRepositories();
            const template = await permissionRepository.findTemplateById(id);

            if (!template) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...template,
                _id: template._id?.toString() as string,
                createdAt: template.createdAt || new Date(),
                updatedAt: template.updatedAt || new Date()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: AdminPermissionTemplateResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Permissions"]
            }
        }
    )
    .post(
        "/",
        async ({ body, ability, set }) => {
            if (ability.cannot("create", "admin.permissions")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { permissionRepository } = db.getRepositories();
            const template = await permissionRepository.createTemplate(body);

            return {
                ...template,
                _id: template._id?.toString() as string,
                createdAt: template.createdAt || new Date(),
                updatedAt: template.updatedAt || new Date()
            };
        },
        {
            body: t.Omit(PermissionTemplateSchema, ["_id", "createdAt", "updatedAt"]),
            response: {
                200: AdminPermissionTemplateResponseSchema,
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Permissions"]
            }
        }
    )
    .patch(
        "/:id",
        async ({ params: { id }, body, ability, set }) => {
            if (ability.cannot("update", `admin.permissions.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { permissionRepository, userRepository } = db.getRepositories();
            // We pass the user collection to automatically update users who have this template
            const template = await permissionRepository.updateTemplateById(id, body, userRepository["collection"] as any);

            if (!template) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...template,
                _id: template._id?.toString() as string,
                createdAt: template.createdAt || new Date(),
                updatedAt: template.updatedAt || new Date()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Partial(t.Omit(PermissionTemplateSchema, ["_id", "createdAt", "updatedAt"])),
            response: {
                200: AdminPermissionTemplateResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Permissions"]
            }
        }
    )
    .delete(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("delete", `admin.permissions.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { permissionRepository, userRepository } = db.getRepositories();
            const success = await permissionRepository.deleteTemplateById(id, userRepository["collection"] as any);

            if (!success) {
                set.status = 404;
                return { error: "Not found" };
            }

            return { success: true };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: t.Object({ success: t.Boolean() }),
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Permissions"]
            }
        }
    );
