import { Elysia, t } from "elysia";
import db from "../lib/db";
import { EvaluationSchema } from "../repositories/types";
import { auth } from "../lib/auth";

export const evaluationsRoutes = new Elysia({ prefix: "/evaluations" })
    .derive(async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        return { user: session?.user };
    })
    .onBeforeHandle(({ user, set }) => {
        if (!user) {
            set.status = 401;
            return { error: "Unauthorized" };
        }
    })
    .get("/is-judge", async ({ user }) => {
        const { hackathonRepository, trackRepository } = db.getRepositories();
        
        // Find all active hackathons
        const now = new Date();
        const { items: hackathons } = await hackathonRepository.list({ pageSize: 100 });
        
        const activeHackathons = hackathons.filter(h => {
            const start = new Date(h.date);
            const end = h.endDate ? new Date(h.endDate) : start;
            // Set time to midnight for comparison if no end date
            if (!h.endDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                start.setHours(0, 0, 0, 0);
                return start.getTime() === today.getTime();
            }
            return now >= start && now <= end;
        });

        if (activeHackathons.length === 0) return { isJudge: false };

        // Check if user is a judge in any track of these hackathons
        for (const h of activeHackathons) {
            const tracks = await trackRepository.listByHackathon(h._id.toString());
            if (tracks.some(t => t.judges.includes(user!.id))) {
                return { isJudge: true };
            }
        }

        return { isJudge: false };
    }, {
        detail: { tags: ["Evaluations"] }
    })
    .get("/hackathons", async ({ user }) => {
        const { hackathonRepository, trackRepository } = db.getRepositories();
        const now = new Date();
        const { items: hackathons } = await hackathonRepository.list({ pageSize: 100 });
        
        const activeHackathons = hackathons.filter(h => {
            const start = new Date(h.date);
            const end = h.endDate ? new Date(h.endDate) : start;
            if (!h.endDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                start.setHours(0, 0, 0, 0);
                return start.getTime() === today.getTime();
            }
            return now >= start && now <= end;
        });

        const judgeHackathons = [];
        for (const h of activeHackathons) {
            const tracks = await trackRepository.listByHackathon(h._id.toString());
            if (tracks.some(t => t.judges.includes(user!.id))) {
                judgeHackathons.push({
                    _id: h._id.toString(),
                    title: h.title,
                    slug: h.slug
                });
            }
        }

        return judgeHackathons;
    })
    .get("/hackathons/:id", async ({ params: { id }, user, set }) => {
        const { hackathonRepository, trackRepository } = db.getRepositories();
        const hackathon = await hackathonRepository.findById(id);
        if (!hackathon) {
            set.status = 404;
            return { error: "Hackathon not found" };
        }

        const tracks = await trackRepository.listByHackathon(id);
        if (!tracks.some(t => t.judges.includes(user!.id))) {
            set.status = 403;
            return { error: "Access denied" };
        }

        return {
            _id: hackathon._id.toString(),
            title: hackathon.title,
            slug: hackathon.slug
        };
    })
    .get("/hackathons/:id/tracks", async ({ params: { id }, user }) => {
        const { trackRepository } = db.getRepositories();
        const tracks = await trackRepository.listByHackathon(id);
        
        return tracks.map(t => ({
            _id: t._id.toString(),
            name: t.name,
            isJudge: t.judges.includes(user!.id),
            rubric: t.rubric
        })).sort((a, b) => (a.isJudge === b.isJudge ? 0 : a.isJudge ? -1 : 1));
    })
    .get("/tracks/:trackId", async ({ params: { trackId }, set }) => {
        const { trackRepository } = db.getRepositories();
        const track = await trackRepository.findById(trackId);
        if (!track) {
            set.status = 404;
            return { error: "Track not found" };
        }
        return {
            _id: track._id.toString(),
            name: track.name,
            hackathonId: track.hackathonId.toString()
        };
    })
    .get("/tracks/:trackId/teams", async ({ params: { trackId }, user }) => {
        const { teamRepository, evaluationRepository, userRepository } = db.getRepositories();
        const { items: teams } = await teamRepository.list({ trackId, pageSize: 200 });
        
        const evaluations = await evaluationRepository.findByTeamsAndJudge(teams.map(t => t._id.toString()), user!.id);
        const evalMap = new Map(evaluations.map(e => [e.teamId.toString(), e]));

        const results = [];
        for (const t of teams) {
            const evaluation = evalMap.get(t._id.toString());
            
            // Resolve member names
            const members = [];
            if (t.users && t.users.length > 0) {
                for (const userId of t.users) {
                    const u = await userRepository.findById(userId);
                    if (u) members.push(u.name || u.email || userId);
                    else members.push(userId);
                }
            }

            results.push({
                _id: t._id.toString(),
                name: t.name,
                members,
                description: t.projectDescription,
                evaluation: evaluation ? {
                    totalScore: evaluation.totalScore,
                    scores: evaluation.scores
                } : null
            });
        }
        return results;
    })
    .get("/teams/:teamId/evaluation", async ({ params: { teamId }, user }) => {
        const { evaluationRepository } = db.getRepositories();
        const evaluation = await evaluationRepository.findByTeamAndJudge(teamId, user!.id);
        return evaluation || { scores: {}, totalScore: 0 };
    })
    .get("/teams/:teamId", async ({ params: { teamId }, set }) => {
        const { teamRepository } = db.getRepositories();
        const team = await teamRepository.findById(teamId);
        if (!team) {
            set.status = 404;
            return { error: "Team not found" };
        }
        return {
            _id: team._id.toString(),
            name: team.name,
            trackId: team.trackId?.toString(),
            hackathonId: team.hackathonId.toString()
        };
    })
    .post("/teams/:teamId/evaluation", async ({ params: { teamId }, body, user, set }) => {
        const { evaluationRepository, teamRepository, trackRepository } = db.getRepositories();
        
        // Find team to get trackId
        const team = await teamRepository.findById(teamId);
        if (!team || !team.trackId) {
            set.status = 400;
            return { error: "Team or track not found" };
        }

        // Find track to get rubric
        const track = await trackRepository.findById(team.trackId.toString());
        if (!track) {
            set.status = 400;
            return { error: "Track not found" };
        }

        // Check if user is a judge in this track
        if (!track.judges.includes(user!.id)) {
            set.status = 403;
            return { error: "You are not a judge for this track" };
        }

        return await evaluationRepository.upsert({ ...body, teamId }, user!.id, track.rubric);
    }, {
        body: t.Omit(EvaluationSchema, ["teamId", "judgeId", "totalScore", "createdAt", "updatedAt"])
    })
    .delete("/teams/:teamId/evaluation", async ({ params: { teamId }, user, set }) => {
        const { evaluationRepository } = db.getRepositories();
        const deleted = await evaluationRepository.delete(teamId, user!.id);
        if (!deleted) {
            set.status = 404;
            return { error: "Evaluation not found" };
        }
        return { success: true };
    });
