import { Elysia, t } from "elysia";
import db from "../lib/db";
import { LinkSchema } from "../repositories/types";

export const linksRoutes = new Elysia({ prefix: "/links" }).get(
    "/:slug",
    async ({ params: { slug }, set }) => {
        const { linkRepository } = db.getRepositories();
        const link = await linkRepository.findBySlug(slug);

        if (!link || !link.isActive) {
            set.status = 404;
            return { error: "Link not found or inactive" };
        }

        // Increment clicks asynchronously
        linkRepository.incrementClicks(link._id.toString()).catch((err) => {
            console.error(`Failed to increment clicks for link ${slug}:`, err);
        });

        return {
            ...link,
            _id: link._id.toString()
        };
    },
    {
        params: t.Object({
            slug: t.String()
        }),
        response: {
            200: t.Composite([LinkSchema, t.Object({ _id: t.String() })]),
            404: t.Object({ error: t.String() })
        },
        detail: {
            tags: ["Links"]
        }
    }
);
