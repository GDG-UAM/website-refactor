import { Elysia, t } from "elysia";
import db from "../lib/db";
import { localePlugin } from "../plugins/locale";
import type { ArticleType } from "../repositories/types";
import type { ArticleSortTypes } from "../repositories/ArticleRepository";
import { permissionsPlugin } from "../plugins/permissions";

const LocalizedArticleSchema = t.Object({
    _id: t.String(),
    type: t.Union([t.Literal("blog"), t.Literal("newsletter")]),
    title: t.String(),
    slug: t.String(),
    excerpt: t.Optional(t.String()),
    content: t.String(),
    coverImage: t.Optional(t.String()),
    coverImageBlurHash: t.Optional(t.String()),
    coverImageWidth: t.Optional(t.Number()),
    coverImageHeight: t.Optional(t.Number()),
    authors: t.Array(t.String()),
    publishedAt: t.Optional(t.Nullable(t.Date()))
});

const ReducedLocalizedArticleSchema = t.Object({
    _id: t.String(),
    type: t.Union([t.Literal("blog"), t.Literal("newsletter")]),
    title: t.String(),
    slug: t.String(),
    excerpt: t.Optional(t.String()),
    coverImage: t.Optional(t.String()),
    coverImageBlurHash: t.Optional(t.String()),
    coverImageWidth: t.Optional(t.Number()),
    coverImageHeight: t.Optional(t.Number()),
    authors: t.Array(t.String()),
    publishedAt: t.Optional(t.Nullable(t.Date()))
});

export const articlesRoutes = new Elysia({ prefix: "/articles" })
    .use(localePlugin)
    .get(
        "/",
        async ({ query: { type, q, page, pageSize, sort }, locale }) => {
            const { articleRepository } = db.getRepositories();
            const data = await articleRepository.list({
                type: type as ArticleType,
                status: "published",
                search: q,
                page,
                pageSize,
                sort: (sort as ArticleSortTypes) || "newest",
                includeInactive: false
            });

            // Map each item to localized version
            const items = data.items.map((item) => {
                const l = locale;
                return {
                    ...item,
                    _id: item._id.toString(),
                    title: item.title[l] || item.title["es"] || Object.values(item.title)[0] || "",
                    excerpt: item.excerpt ? item.excerpt[l] || item.excerpt["es"] || Object.values(item.excerpt)[0] || "" : ""
                };
            });

            return { ...data, items };
        },
        {
            query: t.Object({
                type: t.Optional(t.Union([t.Literal("newsletter"), t.Literal("blog")])),
                q: t.Optional(t.String()),
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
                sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest")], { default: "newest" }))
            }),
            response: {
                200: t.Object({
                    items: t.Array(ReducedLocalizedArticleSchema),
                    total: t.Number(),
                    page: t.Number(),
                    pageSize: t.Number()
                })
            }
        }
    )
    .use(permissionsPlugin)
    .get(
        "/:slug",
        async ({ params: { slug }, query: { type }, locale, set, ability }) => {
            const { articleRepository } = db.getRepositories();
            const article = await articleRepository.findBySlug(slug, type as ArticleType, { incrementView: true });

            if (!article || !ability.can("read", `articles.${article._id}`, article)) {
                set.status = 404;
                return { error: "Not found" };
            }

            const l = locale;
            return {
                ...article,
                _id: article._id.toString(),
                title: article.title[l] || article.title["es"] || Object.values(article.title)[0] || "",
                excerpt: article.excerpt ? article.excerpt[l] || article.excerpt["es"] || Object.values(article.excerpt)[0] || "" : "",
                content: article.content[l] || article.content["es"] || Object.values(article.content)[0] || ""
            };
        },
        {
            params: t.Object({ slug: t.String() }),
            query: t.Object({ type: t.Optional(t.Union([t.Literal("newsletter"), t.Literal("blog")])) }),
            response: {
                200: LocalizedArticleSchema,
                404: t.Object({ error: t.String() })
            }
        }
    );
