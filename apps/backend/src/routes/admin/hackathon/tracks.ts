import { Elysia, t } from "elysia";
import db from "../../../lib/db";
import { permissionsPlugin } from "../../../plugins/permissions";
import { TrackSchema } from "../../../repositories/types";

const AdminTrackResponseSchema = t.Object({
    _id: t.String(),
    hackathonId: t.String(),
    name: t.String(),
    judges: t.Array(t.String()),
    rubric: t.Array(
        t.Object({
            name: t.String(),
            weight: t.Number()
        })
    ),
    isActive: t.Boolean(),
    createdBy: t.String(),
    createdAt: t.Union([t.Date(), t.String()]),
    updatedAt: t.Union([t.Date(), t.String()])
});

export const adminTracksRoutes = new Elysia({ prefix: "/:id/tracks" })
    .use(permissionsPlugin)
    .get(
        "/",
        async ({ params: { id }, query: { search, page, pageSize, includeInactive }, ability, set }) => {
            if (ability.cannot("read", `admin.hackathons.${id}.tracks`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { trackRepository } = db.getRepositories();
            const shouldIncludeInactive = includeInactive && ability.can("manage", `admin.hackathons.${id}.tracks`);

            const data = await trackRepository.list({
                hackathonId: id,
                search,
                page,
                pageSize,
                includeInactive: shouldIncludeInactive
            });

            return {
                ...data,
                items: data.items.map((item) => ({
                    ...item,
                    _id: item._id.toString(),
                    hackathonId: item.hackathonId.toString()
                }))
            };
        },
        {
            params: t.Object({ id: t.String() }),
            query: t.Object({
                search: t.Optional(t.String()),
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
                includeInactive: t.Optional(t.Boolean())
            }),
            response: {
                200: t.Object({
                    items: t.Array(AdminTrackResponseSchema),
                    total: t.Number(),
                    page: t.Number(),
                    pageSize: t.Number()
                }),
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Hackathons"]
            }
        }
    )
    .post(
        "/",
        async ({ params: { id }, body, ability, user, set }) => {
            if (ability.cannot("create", `admin.hackathons.${id}.tracks`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { trackRepository } = db.getRepositories();
            const track = await trackRepository.create({ ...body, hackathonId: id }, user!.id);
            return {
                ...track,
                _id: track._id.toString(),
                hackathonId: track.hackathonId.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Omit(TrackSchema, ["_id", "hackathonId", "isActive", "createdBy", "createdAt", "updatedAt"]),
            response: {
                200: AdminTrackResponseSchema,
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Hackathons"]
            }
        }
    )
    .get(
        "/:trackId",
        async ({ params: { id, trackId }, ability, set }) => {
            if (ability.cannot("read", `admin.hackathons.${id}.tracks.${trackId}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { trackRepository } = db.getRepositories();
            const track = await trackRepository.findById(trackId, { includeInactive: true });

            if (!track || track.hackathonId.toString() !== id) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...track,
                _id: track._id.toString(),
                hackathonId: track.hackathonId.toString()
            };
        },
        {
            params: t.Object({ id: t.String(), trackId: t.String() }),
            response: {
                200: AdminTrackResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Hackathons"]
            }
        }
    )
    .patch(
        "/:trackId",
        async ({ params: { id, trackId }, body, ability, set }) => {
            if (ability.cannot("update", `admin.hackathons.${id}.tracks.${trackId}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            // Granular check for fields
            for (const field of Object.keys(body)) {
                if (ability.cannot("update", `admin.hackathons.${id}.tracks.${trackId}`, { field })) {
                    set.status = 403;
                    return { error: `Forbidden: Cannot update field ${field}` };
                }
            }

            const { trackRepository } = db.getRepositories();
            const updated = await trackRepository.update(trackId, body);

            if (!updated) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...updated,
                _id: updated._id.toString(),
                hackathonId: updated.hackathonId.toString()
            };
        },
        {
            params: t.Object({ id: t.String(), trackId: t.String() }),
            body: t.Partial(t.Omit(TrackSchema, ["_id", "hackathonId", "createdBy", "createdAt", "updatedAt"])),
            response: {
                200: AdminTrackResponseSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Hackathons"]
            }
        }
    )
    .delete(
        "/:trackId",
        async ({ params: { id, trackId }, ability, set }) => {
            if (ability.cannot("delete", `admin.hackathons.${id}.tracks.${trackId}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { trackRepository } = db.getRepositories();
            const success = await trackRepository.delete(trackId);

            if (!success) {
                set.status = 404;
                return { error: "Not found" };
            }

            return { success: true };
        },
        {
            params: t.Object({ id: t.String(), trackId: t.String() }),
            response: {
                200: t.Object({ success: t.Boolean() }),
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Hackathons"]
            }
        }
    )
    .get(
        "/:trackId/leaderboard",
        async ({ params: { id, trackId }, ability, set }) => {
            if (ability.cannot("read", `admin.hackathons.${id}.tracks.${trackId}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { trackRepository, teamRepository, evaluationRepository } = db.getRepositories();
            const track = await trackRepository.findById(trackId);

            if (!track || track.hackathonId.toString() !== id) {
                set.status = 404;
                return { error: "Track not found" };
            }

            // Get all teams for this track
            const { items: teams } = await teamRepository.list({ trackId, pageSize: 1000 });
            const teamIds = teams.map((t) => t._id);

            // Get scores from evaluations
            const scores = await evaluationRepository.getTrackLeaderboard(teamIds);
            const scoreMap = new Map(scores.map((s) => [s.teamId, s]));

            return teams.map((t) => {
                const score = scoreMap.get(t._id.toString());
                return {
                    _id: t._id.toString(),
                    name: t.name,
                    averageScore: score?.averageScore || 0,
                    evaluationsCount: score?.count || 0
                };
            });
        },
        {
            params: t.Object({ id: t.String(), trackId: t.String() }),
            response: {
                200: t.Array(
                    t.Object({
                        _id: t.String(),
                        name: t.String(),
                        averageScore: t.Number(),
                        evaluationsCount: t.Number()
                    })
                ),
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Hackathons"]
            }
        }
    )
    .get(
        "/:trackId/leaderboard/teams/:teamId",
        async ({ params: { id, trackId, teamId }, ability, set }) => {
            if (ability.cannot("read", `admin.hackathons.${id}.tracks.${trackId}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { teamRepository, evaluationRepository, userRepository } = db.getRepositories();
            const team = await teamRepository.findById(teamId);

            if (!team || team.trackId?.toString() !== trackId) {
                set.status = 404;
                return { error: "Team not found" };
            }

            const evaluations = await evaluationRepository.findByTeam(teamId);
            const judgeIds = [...new Set(evaluations.map((e) => e.judgeId))];
            const judges = await userRepository.findByIds(judgeIds);
            const judgeMap = new Map(judges.map((j) => [j._id.toString(), j]));

            return {
                name: team.name,
                description: team.projectDescription || "",
                evaluations: evaluations.map((e) => {
                    const judge = judgeMap.get(e.judgeId);
                    return {
                        judgeName: judge?.name || judge?.email || e.judgeId,
                        judgeImage: judge?.image || null,
                        scores: e.scores,
                        totalScore: e.totalScore,
                        notes: e.notes || "",
                        createdAt: e.createdAt
                    };
                })
            };
        },
        {
            params: t.Object({ id: t.String(), trackId: t.String(), teamId: t.String() }),
            response: {
                200: t.Object({
                    name: t.String(),
                    description: t.String(),
                    evaluations: t.Array(
                        t.Object({
                            judgeName: t.String(),
                            judgeImage: t.Nullable(t.String()),
                            scores: t.Record(t.String(), t.Number()),
                            totalScore: t.Number(),
                            notes: t.String(),
                            createdAt: t.Date()
                        })
                    )
                }),
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Hackathons"]
            }
        }
    );
