import { Elysia, t } from "elysia";
import db from "../lib/db";
import { LinkSchema } from "../repositories/types";
import { trackView } from "../lib/views";

export const linksRoutes = new Elysia({ prefix: "/links" }).get(
    "/:slug",
    async ({ params: { slug }, set, request }) => {
        const { linkRepository } = db.getRepositories();
        const link = await linkRepository.findBySlug(slug);

        if (!link || !link.isActive) {
            set.status = 404;
            return { error: "Link not found or inactive" };
        }

        trackView(request.headers, `link:${link._id}`, () => linkRepository.incrementClicks(link._id.toString()));

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
