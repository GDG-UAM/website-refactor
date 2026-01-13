import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import { LinkSchema, LinkInputSchema, LinksListResponseSchema } from "../../repositories/types";

// Using types from repositories to avoid duplication
const AdminLinkSchema = t.Composite([LinkSchema, t.Object({ _id: t.String() })]);

export const adminLinksRoutes = new Elysia({ prefix: "/links" })
    .use(permissionsPlugin)
    .get(
        "/",
        async ({ query: { page, pageSize, search, includeInactive }, ability, set }) => {
            if (ability.cannot("read", "admin.links")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { linkRepository } = db.getRepositories();
            const shouldIncludeInactive = includeInactive && ability.can("manage", "admin.links");

            const data = await linkRepository.list({
                page,
                pageSize,
                search,
                includeInactive: shouldIncludeInactive
            });

            return {
                ...data,
                items: data.items.map((item) => ({
                    ...item,
                    _id: item._id.toString()
                }))
            };
        },
        {
            query: t.Object({
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
                search: t.Optional(t.String()),
                includeInactive: t.Optional(t.Boolean())
            }),
            response: {
                200: LinksListResponseSchema,
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Links"]
            }
        }
    )
    .post(
        "/",
        async ({ body, ability, user, set }) => {
            if (ability.cannot("create", "admin.links")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            // Field-level permission check for creation
            const fields = Object.keys(body);
            for (const field of fields) {
                if (ability.cannot("create", "admin.links", { field })) {
                    set.status = 403;
                    return { error: `Forbidden: Cannot set field ${field}` };
                }
            }

            const { linkRepository } = db.getRepositories();
            const link = await linkRepository.create(body, user!.id);

            return {
                ...link,
                _id: link._id.toString()
            };
        },
        {
            body: LinkInputSchema,
            response: {
                200: AdminLinkSchema,
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Links"]
            }
        }
    )
    .get(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("read", `admin.links.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { linkRepository } = db.getRepositories();
            const link = await linkRepository.findById(id, { includeInactive: true });

            if (!link) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...link,
                _id: link._id.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: AdminLinkSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Links"]
            }
        }
    )
    .patch(
        "/:id",
        async ({ params: { id }, body, ability, set }) => {
            // Granular permission check for updates
            const fields = Object.keys(body);
            for (const field of fields) {
                if (ability.cannot("update", `admin.links.${id}`, { field })) {
                    set.status = 403;
                    return { error: `Forbidden: Cannot update field ${field}` };
                }
            }

            const { linkRepository } = db.getRepositories();
            const updated = await linkRepository.update(id, body);

            if (!updated) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...updated,
                _id: updated._id.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Partial(LinkInputSchema),
            response: {
                200: AdminLinkSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Links"]
            }
        }
    )
    .delete(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("delete", `admin.links.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { linkRepository } = db.getRepositories();
            const success = await linkRepository.delete(id);

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
                tags: ["Admin - Links"]
            }
        }
    );
