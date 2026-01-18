import { Elysia, t } from "elysia";
import db from "../lib/db";
import type { EventSortTypes } from "../repositories/EventRepository";
import { permissionsPlugin } from "../plugins/permissions";

const EventResponseSchema = t.Object({
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
    status: t.String(),
    url: t.Optional(t.String()),
    blogUrl: t.Optional(t.String())
});

const ReducedEventResponseSchema = t.Object({
    _id: t.String(),
    title: t.String(),
    slug: t.String(),
    description: t.Optional(t.String()),
    date: t.Date(),
    location: t.Optional(t.String()),
    image: t.Optional(t.String()),
    imageBlurHash: t.Optional(t.String()),
    imageWidth: t.Optional(t.Number()),
    imageHeight: t.Optional(t.Number()),
    url: t.Optional(t.String()),
    blogUrl: t.Optional(t.String())
});

export const eventsRoutes = new Elysia({ prefix: "/events" })
    .get(
        "/",
        async ({ query: { dateStatus, page, pageSize, sort } }) => {
            const { eventRepository } = db.getRepositories();
            const data = await eventRepository.list({
                status: "published",
                dateStatus: dateStatus as "past" | "upcoming",
                page,
                pageSize,
                sort: (sort as EventSortTypes) || "newest",
                includeInactive: false
            });

            const items = data.items.map((item) => ({
                ...item,
                _id: item._id.toString()
            }));

            return { ...data, items };
        },
        {
            query: t.Object({
                dateStatus: t.Optional(t.Union([t.Literal("past"), t.Literal("upcoming")], { default: "upcoming" })),
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
                sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest")], { default: "newest" }))
            }),
            response: {
                200: t.Object({
                    items: t.Array(ReducedEventResponseSchema),
                    total: t.Number(),
                    page: t.Number(),
                    pageSize: t.Number()
                })
            },
            detail: {
                tags: ["Events"]
            }
        }
    )
    .use(permissionsPlugin)
    .get(
        "/:id",
        async ({ params: { id }, set }) => {
            const { eventRepository } = db.getRepositories();
            // Try slug first
            let event = await eventRepository.findBySlug(id);
            if (!event) {
                try {
                    // Try by ID if not found by slug
                    event = await eventRepository.findById(id);
                } catch {
                    set.status = 500;
                    return { error: "Internal server error" };
                }
            }

            if (!event || event.status === "draft") {
                set.status = 404;
                return { error: "Event not found" };
            }

            return {
                ...event,
                _id: event._id.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: EventResponseSchema,
                404: t.Object({ error: t.String() }),
                500: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Events"]
            }
        }
    );
