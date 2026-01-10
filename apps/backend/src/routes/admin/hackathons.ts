import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import { HackathonSchema } from "../../repositories/types";
import type { HackathonSortTypes, HackathonInput } from "../../repositories/HackathonRepository";
import { websocketsPlugin } from "../../plugins/websockets";
import { adminHackathonRoutes } from "./hackathon";

const AdminHackathonResponseSchema = t.Object({
    _id: t.String(),
    title: t.String(),
    slug: t.String(),
    date: t.Union([t.Date(), t.String()]),
    endDate: t.Optional(t.Nullable(t.Union([t.Date(), t.String()]))),
    location: t.Optional(t.Nullable(t.String())),
    intermission: t.Optional(t.Nullable(t.Any())), // Using Any to avoid complex recursive validation issues on response
    certificateDefaults: t.Optional(t.Nullable(t.Any())),
    isActive: t.Boolean(),
    createdBy: t.String(),
    createdAt: t.Union([t.Date(), t.String()]),
    updatedAt: t.Union([t.Date(), t.String()])
});

export const adminHackathonsRoutes = new Elysia({ prefix: "/hackathons" })
    .use(permissionsPlugin)
    .use(adminHackathonRoutes)
    .get(
        "/",
        async ({ query: { search, page, pageSize, sort, includeInactive }, ability, set }) => {
            if (ability.cannot("read", "admin.hackathons")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { hackathonRepository } = db.getRepositories();
            const shouldIncludeInactive = includeInactive && ability.can("manage", "admin.hackathons");

            const data = await hackathonRepository.list({
                search,
                page,
                pageSize,
                sort: (sort as HackathonSortTypes) || "newest",
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
                search: t.Optional(t.String()),
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
                sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest"), t.Literal("title_asc"), t.Literal("title_desc")], { default: "newest" })),
                includeInactive: t.Optional(t.Boolean())
            }),
            response: {
                200: t.Object({
                    items: t.Array(AdminHackathonResponseSchema),
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
            if (ability.cannot("create", "admin.hackathons")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { hackathonRepository } = db.getRepositories();
            const hackathon = await hackathonRepository.create(body, user!.id);
            return {
                ...hackathon,
                _id: hackathon._id.toString()
            };
        },
        {
            body: HackathonSchema,
            response: {
                200: AdminHackathonResponseSchema,
                403: t.Object({ error: t.String() })
            }
        }
    )
    .get(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("read", `admin.hackathons.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { hackathonRepository } = db.getRepositories();
            const hackathon = await hackathonRepository.findById(id, { includeInactive: true });

            if (!hackathon) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...hackathon,
                _id: hackathon._id.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: AdminHackathonResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            }
        }
    )
    .use(websocketsPlugin)
    .patch(
        "/:id",
        async ({ params: { id }, body, ability, set, publish }) => {
            // Granular permission check
            const fields = Object.keys(body);
            for (const field of fields) {
                if (field === "intermission" || field === "certificateDefaults") {
                    // Special granularity for intermission and certificateDefaults sub-fields
                    const subFields = body[field as "intermission" | "certificateDefaults"];
                    if (subFields && typeof subFields === "object") {
                        for (const subField of Object.keys(subFields as object)) {
                            if (ability.cannot("update", `admin.hackathons.${id}.${field}`, { field: subField })) {
                                set.status = 403;
                                return { error: `Forbidden: Cannot update ${field} field ${subField}` };
                            }
                        }
                    }
                } else {
                    // Check general field permission
                    if (ability.cannot("update", `admin.hackathons.${id}`, { field })) {
                        set.status = 403;
                        return { error: `Forbidden: Cannot update field ${field}` };
                    }
                }
            }

            const { hackathonRepository } = db.getRepositories();
            const updated = await hackathonRepository.update(id, body);

            if (!updated) {
                set.status = 404;
                return { error: "Not found" };
            }

            if (body.intermission) {
                publish(`hackathon-intermission-${updated.slug}`, body.intermission);
            }

            return {
                ...updated,
                _id: updated._id.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Partial(HackathonSchema),
            response: {
                200: AdminHackathonResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            }
        }
    )
    .delete(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("delete", `admin.hackathons.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { hackathonRepository } = db.getRepositories();
            const success = await hackathonRepository.delete(id);

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
