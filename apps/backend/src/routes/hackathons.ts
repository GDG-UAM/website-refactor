import { Elysia, t } from "elysia";
import db from "../lib/db";
import { AdminHackathonIntermissionSchema } from "../repositories/types";
import { WSData } from "../plugins/websockets";

export const hackathonRoutes = new Elysia({ prefix: "/hackathons" })
    .get(
        "/:slug/intermission",
        async ({ params: { slug }, set }) => {
            const { hackathonRepository } = db.getRepositories();
            const hackathon = await hackathonRepository.findBySlug(slug);

            if (!hackathon || !hackathon.intermission) {
                set.status = 404;
                return { error: "Hackathon not found" };
            }

            return hackathon.intermission;
        },
        {
            params: t.Object({
                slug: t.String()
            }),
            response: {
                200: AdminHackathonIntermissionSchema,
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Hackathons"]
            }
        }
    )
    .ws("/:slug/intermission/ws", {
        params: t.Object({
            slug: t.String()
        }),
        open(ws) {
            const topic = `hackathon-intermission-${ws.data.params.slug}`;

            ws.subscribe(topic);

            const pingInterval = setInterval(() => {
                if (ws.raw && ws.raw.readyState === 1) {
                    ws.raw.ping();
                }
            }, 25000);

            (ws.data as WSData).pingInterval = pingInterval;
        },
        close(ws) {
            const topic = `hackathon-intermission-${ws.data.params.slug}`;

            ws.unsubscribe(topic);

            if ((ws.data as WSData).pingInterval) {
                clearInterval((ws.data as WSData).pingInterval);
            }
        }
    });
