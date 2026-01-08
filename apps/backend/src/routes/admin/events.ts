import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import type { EventStatus } from "../../repositories/types";

const CreateEventSchema = t.Object({
    title: t.String(),
    slug: t.Optional(t.String()),
    markdownContent: t.String(),
    description: t.Optional(t.String()),
    date: t.Date(),
    location: t.Optional(t.String()),
    image: t.Optional(t.String()),
    status: t.Union([t.Literal("draft"), t.Literal("published")]),
    url: t.Optional(t.String()),
    blogUrl: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean())
});

const AdminEventSchema = t.Object({
    _id: t.String(),
    title: t.String(),
    slug: t.String(),
    markdownContent: t.String(),
    description: t.Optional(t.String()),
    date: t.Date(),
    location: t.Optional(t.String()),
    image: t.Optional(t.String()),
    imageBlurHash: t.Optional(t.String()),
    imageWidth: t.Optional(t.Number()),
    imageHeight: t.Optional(t.Number()),
    status: t.Union([t.Literal("draft"), t.Literal("published")]),
    url: t.Optional(t.String()),
    blogUrl: t.Optional(t.String()),
    isActive: t.Boolean(),
    createdBy: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date()
});

export const adminEventsRoutes = new Elysia({ prefix: "/events" })
    .use(permissionsPlugin)
    .get(
        "/",
        async ({ query: { status, dateStatus, search, page, pageSize, sort, includeInactive }, ability, set }) => {
            if (ability.cannot("read", "admin.events")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { eventRepository } = db.getRepositories();
            const shouldIncludeInactive = includeInactive && ability.can("manage", "admin.events");

            const data = await eventRepository.list({
                status: status as EventStatus,
                dateStatus: dateStatus,
                search: search,
                page,
                pageSize,
                sort: sort || "newest",
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
                status: t.Optional(t.Union([t.Literal("draft"), t.Literal("published")])),
                dateStatus: t.Optional(t.Union([t.Literal("past"), t.Literal("upcoming")])),
                search: t.Optional(t.String()),
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
                sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest"), t.Literal("title_asc"), t.Literal("title_desc")], { default: "newest" })),
                includeInactive: t.Optional(t.Boolean())
            }),
            response: {
                200: t.Object({
                    items: t.Array(AdminEventSchema),
                    total: t.Number(),
                    page: t.Number(),
                    pageSize: t.Number()
                }),
                403: t.Object({ error: t.String() })
            }
        }
    )
    .post(
        "/",
        async ({ body, ability, user, set }) => {
            if (ability.cannot("create", "admin.events")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { eventRepository } = db.getRepositories();
            const event = await eventRepository.create(body, user!.id);
            return {
                ...event,
                _id: event._id.toString()
            };
        },
        {
            body: CreateEventSchema,
            response: {
                200: AdminEventSchema,
                403: t.Object({ error: t.String() })
            }
        }
    )
    .get(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("read", `admin.events.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { eventRepository } = db.getRepositories();
            const event = await eventRepository.findByIdForEdit(id);

            if (!event) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...event,
                _id: event._id.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: AdminEventSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            }
        }
    )
    .patch(
        "/:id",
        async ({ params: { id }, body, ability, set }) => {
            // Granular permission check
            const fields = Object.keys(body);
            for (const field of fields) {
                if (ability.cannot("update", `admin.events.${id}`, { field })) {
                    set.status = 403;
                    return { error: `Forbidden: Cannot update field ${field}` };
                }
            }

            const { eventRepository } = db.getRepositories();
            const updated = await eventRepository.update(id, body);

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
            body: t.Partial(CreateEventSchema),
            response: {
                200: AdminEventSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            }
        }
    )
    .delete(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("delete", `admin.events.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { eventRepository } = db.getRepositories();
            const success = await eventRepository.delete(id);

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
            }
        }
    );
