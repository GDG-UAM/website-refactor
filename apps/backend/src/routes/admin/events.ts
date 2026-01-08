import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import type { EventStatus } from "../../repositories/types";

const CreateEventSchema = t.Object({
    title: t.String(),
    slug: t.Optional(t.String()),
    markdownContent: t.String(),
    description: t.String(),
    date: t.Date(),
    location: t.String(),
    image: t.Optional(t.String()),
    status: t.Union([t.Literal("draft"), t.Literal("published")]),
    url: t.Optional(t.String()),
    blogUrl: t.Optional(t.String())
});

export const adminEventsRoutes = new Elysia({ prefix: "/events" })
    .use(permissionsPlugin)
    .get(
        "/",
        async ({ query: { status, dateStatus, page, pageSize, sort }, ability, set }) => {
            if (ability.cannot("read", "events")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { eventRepository } = db.getRepositories();
            const data = await eventRepository.list({
                status: status as EventStatus,
                dateStatus: dateStatus,
                page,
                pageSize,
                sort: sort || "newest",
                includeInactive: true
            });

            return data;
        },
        {
            query: t.Object({
                status: t.Optional(t.String()),
                dateStatus: t.Optional(t.Union([t.Literal("past"), t.Literal("upcoming")])),
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
                sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest")], { default: "newest" }))
            })
        }
    )
    .post(
        "/",
        async ({ body, ability, user, set }) => {
            if (ability.cannot("create", "events")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { eventRepository } = db.getRepositories();
            const event = await eventRepository.create(body, user!.id);
            return event;
        },
        {
            body: CreateEventSchema
        }
    )
    .get(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("read", `events.${id}`) && ability.cannot("read", "events")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { eventRepository } = db.getRepositories();
            const event = await eventRepository.findByIdForEdit(id);

            if (!event) {
                set.status = 404;
                return { error: "Not found" };
            }

            return event;
        },
        {
            params: t.Object({ id: t.String() })
        }
    )
    .patch(
        "/:id",
        async ({ params: { id }, body, ability, set }) => {
            // Granular permission check
            const fields = Object.keys(body);
            for (const field of fields) {
                if (ability.cannot("update", `events.${id}.${field}`) && ability.cannot("update", `events.${field}`)) {
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

            return updated;
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Partial(CreateEventSchema)
        }
    )
    .delete(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("delete", `events.${id}`) && ability.cannot("delete", "events")) {
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
            params: t.Object({ id: t.String() })
        }
    );
