import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import { localePlugin } from "../../plugins/locale";

const StatsResponseSchema = t.Object({
    articles: t.Array(
        t.Object({
            _id: t.String(),
            type: t.Union([t.Literal("blog"), t.Literal("newsletter")]),
            title: t.String(),
            slug: t.String(),
            status: t.Union([t.Literal("draft"), t.Literal("published"), t.Literal("url_only")]),
            views: t.Number(),
            date: t.Date(),
            authors: t.Array(t.String()),
            excluded: t.Boolean()
        })
    ),
    links: t.Array(
        t.Object({
            _id: t.String(),
            title: t.String(),
            slug: t.String(),
            clicks: t.Number(),
            date: t.Date(),
            excluded: t.Boolean()
        })
    )
});

export const adminStatsRoutes = new Elysia({ prefix: "/stats" })
    .use(permissionsPlugin)
    .use(localePlugin)
    .get(
        "/",
        async ({ ability, set, locale }) => {
            if (ability.cannot("read", "admin.stats")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { articleRepository, linkRepository, userRepository } = db.getRepositories();
            const [articles, links] = await Promise.all([articleRepository.findForStats(), linkRepository.findForStats()]);

            const users = await userRepository.findByIds([...new Set(articles.flatMap((a) => a.authors))]);
            const names = new Map(users.map((u) => [u._id.toString(), u.displayName || u.name]));

            return {
                articles: articles.map((a) => ({
                    _id: a._id.toString(),
                    type: a.type,
                    title: a.title[locale] || a.title["es"] || Object.values(a.title)[0] || a.slug,
                    slug: a.slug,
                    status: a.status,
                    views: a.views ?? 0,
                    date: a.publishedAt ?? a.createdAt,
                    authors: a.authors.map((id) => names.get(id) ?? id),
                    excluded: !!a.excludeFromStats
                })),
                links: links.map((l) => ({
                    _id: l._id.toString(),
                    title: l.title,
                    slug: l.slug,
                    clicks: l.clicks ?? 0,
                    date: l.createdAt,
                    excluded: !!l.excludeFromStats
                }))
            };
        },
        {
            response: {
                200: StatsResponseSchema,
                403: t.Object({ error: t.String() })
            },
            detail: { tags: ["Admin - Stats"] }
        }
    )
    .patch(
        "/:kind/:id",
        async ({ params: { kind, id }, body: { excluded }, ability, set }) => {
            if (ability.cannot("update", "admin.stats")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { articleRepository, linkRepository } = db.getRepositories();
            const repository = kind === "article" ? articleRepository : linkRepository;

            if (!(await repository.setExcludeFromStats(id, excluded))) {
                set.status = 404;
                return { error: "Not found" };
            }

            return { success: true };
        },
        {
            params: t.Object({ kind: t.Union([t.Literal("article"), t.Literal("link")]), id: t.String({ pattern: "^[a-f0-9]{24}$" }) }),
            body: t.Object({ excluded: t.Boolean() }),
            response: {
                200: t.Object({ success: t.Boolean() }),
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: { tags: ["Admin - Stats"] }
        }
    );
