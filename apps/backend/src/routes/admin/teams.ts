import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import { TeamSchema } from "../../repositories/types";

const AdminTeamSchema = t.Object({
    _id: t.String(),
    name: t.String(),
    hackathonId: t.String(),
    trackId: t.Optional(t.Nullable(t.String())),
    password: t.String(),
    projectDescription: t.Optional(t.Nullable(t.String())),
    users: t.Array(t.String()),
    isActive: t.Boolean(),
    createdBy: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date()
});

const ErrorSchema = t.Object({
    error: t.String()
});

const PaginatedTeamSchema = t.Object({
    items: t.Array(AdminTeamSchema),
    total: t.Number(),
    page: t.Number(),
    pageSize: t.Number()
});

export const adminTeamsRoutes = new Elysia({ prefix: "/teams" })
    .use(permissionsPlugin)
    .get(
        "/",
        async ({ query, ability, set }) => {
            const { hackathonId } = query;
            if (hackathonId && ability.cannot("read", `admin.hackathons.${hackathonId}.teams`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { teamRepository } = db.getRepositories();
            const data = await teamRepository.list({
                hackathonId: query.hackathonId,
                trackId: query.trackId,
                search: query.search,
                page: query.page,
                pageSize: query.pageSize,
                sort: query.sort as any,
                includeInactive: query.includeInactive
            });

            return {
                ...data,
                items: data.items.map((item) => ({
                    ...item,
                    _id: item._id.toString(),
                    hackathonId: item.hackathonId.toString(),
                    trackId: item.trackId?.toString() || null
                }))
            };
        },
        {
            query: t.Object({
                hackathonId: t.Optional(t.String()),
                trackId: t.Optional(t.String()),
                search: t.Optional(t.String()),
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1 })),
                sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest"), t.Literal("name_asc"), t.Literal("name_desc")], { default: "newest" })),
                includeInactive: t.Optional(t.Boolean({ default: false }))
            }),
            response: {
                200: PaginatedTeamSchema,
                403: ErrorSchema
            },
            detail: {
                tags: ["Admin - Teams"]
            }
        }
    )
    .get(
        "/:id",
        async ({ params, ability, set }) => {
            const { teamRepository } = db.getRepositories();
            const team = await teamRepository.findById(params.id, { includeInactive: true });
            if (!team) {
                set.status = 404;
                return { error: "Team not found" };
            }

            if (ability.cannot("read", `admin.hackathons.${team.hackathonId.toString()}.teams.${team._id.toString()}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            return {
                ...team,
                _id: team._id.toString(),
                hackathonId: team.hackathonId.toString(),
                trackId: team.trackId?.toString() || null
            };
        },
        {
            params: t.Object({
                id: t.String()
            }),
            response: {
                200: AdminTeamSchema,
                403: ErrorSchema,
                404: ErrorSchema
            },
            detail: {
                tags: ["Admin - Teams"]
            }
        }
    )
    .post(
        "/",
        async ({ body, ability, user, set }) => {
            if (ability.cannot("create", `admin.hackathons.${body.hackathonId}.teams`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { teamRepository } = db.getRepositories();
            const team = await teamRepository.create(body as any, user!.id);
            return {
                ...team,
                _id: team._id.toString(),
                hackathonId: team.hackathonId.toString(),
                trackId: team.trackId?.toString() || null
            };
        },
        {
            body: t.Omit(TeamSchema, ["_id", "password", "createdBy", "createdAt", "updatedAt"]),
            response: {
                200: AdminTeamSchema,
                403: ErrorSchema
            },
            detail: {
                tags: ["Admin - Teams"]
            }
        }
    )
    .patch(
        "/:id",
        async ({ params, body, ability, set }) => {
            const { teamRepository } = db.getRepositories();
            const team = await teamRepository.findById(params.id, { includeInactive: true });
            if (!team) {
                set.status = 404;
                return { error: "Team not found" };
            }

            const resource = `admin.hackathons.${team.hackathonId.toString()}.teams.${team._id.toString()}`;
            const fields = Object.keys(body as object);
            for (const field of fields) {
                if (ability.cannot("update", resource, { field })) {
                    set.status = 403;
                    return { error: `Forbidden: Cannot update field ${field}` };
                }
            }

            const updated = await teamRepository.update(params.id, body as any);
            if (!updated) {
                set.status = 404;
                return { error: "Team not found" };
            }

            return {
                ...updated,
                _id: updated._id.toString(),
                hackathonId: updated.hackathonId.toString(),
                trackId: updated.trackId?.toString() || null
            };
        },
        {
            params: t.Object({
                id: t.String()
            }),
            body: t.Partial(t.Omit(TeamSchema, ["_id", "password", "createdBy", "createdAt", "updatedAt"])),
            response: {
                200: AdminTeamSchema,
                403: ErrorSchema,
                404: ErrorSchema
            },
            detail: {
                tags: ["Admin - Teams"]
            }
        }
    )
    .delete(
        "/:id",
        async ({ params, ability, set }) => {
            const { teamRepository } = db.getRepositories();
            const team = await teamRepository.findById(params.id, { includeInactive: true });
            if (!team) {
                set.status = 404;
                return { error: "Team not found" };
            }

            if (ability.cannot("delete", `admin.hackathons.${team.hackathonId.toString()}.teams.${team._id.toString()}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const success = await teamRepository.delete(params.id);
            if (!success) {
                set.status = 404;
                return { error: "Team not found" };
            }
            return { success: true };
        },
        {
            params: t.Object({
                id: t.String()
            }),
            response: {
                200: t.Object({ success: t.Boolean() }),
                403: ErrorSchema,
                404: ErrorSchema
            },
            detail: {
                tags: ["Admin - Teams"]
            }
        }
    )
    .get(
        "/:id/password",
        async ({ params, ability, set }) => {
            const { teamRepository } = db.getRepositories();
            const team = await teamRepository.findById(params.id, { includeInactive: true });
            if (!team) {
                set.status = 404;
                return { error: "Team not found" };
            }

            const resource = `admin.hackathons.${team.hackathonId.toString()}.teams.${team._id.toString()}`;
            if (ability.cannot("read", resource, { field: "password" })) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            return { password: team.password };
        },
        {
            params: t.Object({
                id: t.String()
            }),
            response: {
                200: t.Object({ password: t.String() }),
                403: ErrorSchema,
                404: ErrorSchema
            },
            detail: {
                tags: ["Admin - Teams"]
            }
        }
    )
    .post(
        "/:id/password/reload",
        async ({ params, ability, set }) => {
            const { teamRepository } = db.getRepositories();
            const team = await teamRepository.findById(params.id, { includeInactive: true });
            if (!team) {
                set.status = 404;
                return { error: "Team not found" };
            }

            const resource = `admin.hackathons.${team.hackathonId.toString()}.teams.${team._id.toString()}`;
            if (ability.cannot("update", resource, { field: "password" })) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const updatedTeam = await teamRepository.reloadPassword(params.id);
            if (!updatedTeam) {
                set.status = 404;
                return { error: "Team not found" };
            }
            return { password: updatedTeam.password };
        },
        {
            params: t.Object({
                id: t.String()
            }),
            response: {
                200: t.Object({ password: t.String() }),
                403: ErrorSchema,
                404: ErrorSchema
            },
            detail: {
                tags: ["Admin - Teams"]
            }
        }
    );
