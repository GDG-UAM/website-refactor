import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import type { ArticleType, ArticleStatus } from "../../repositories/types";
import type { ArticleSortTypes } from "../../repositories/ArticleRepository";

const CreateArticleSchema = t.Object({
    type: t.Union([t.Literal("blog"), t.Literal("newsletter")]),
    title: t.Record(t.String(), t.String()),
    slug: t.Optional(t.String()),
    excerpt: t.Optional(t.Record(t.String(), t.String())),
    content: t.Record(t.String(), t.String()),
    coverImage: t.Optional(t.String()),
    status: t.Union([t.Literal("draft"), t.Literal("published"), t.Literal("url_only")]),
    authors: t.Array(t.String()),
    publishedAt: t.Optional(t.Nullable(t.Date())),
    isActive: t.Optional(t.Boolean())
});

const AdminArticleSchema = t.Object({
    _id: t.String(),
    type: t.Union([t.Literal("blog"), t.Literal("newsletter")]),
    title: t.Record(t.String(), t.String()),
    slug: t.String(),
    excerpt: t.Optional(t.Record(t.String(), t.String())),
    content: t.Record(t.String(), t.String()),
    coverImage: t.Optional(t.String()),
    coverImageBlurHash: t.Optional(t.Nullable(t.String())),
    coverImageWidth: t.Optional(t.Nullable(t.Number())),
    coverImageHeight: t.Optional(t.Nullable(t.Number())),
    status: t.Union([t.Literal("draft"), t.Literal("published"), t.Literal("url_only")]),
    authors: t.Array(t.String()),
    views: t.Number(),
    publishedAt: t.Optional(t.Nullable(t.Date())),
    isActive: t.Boolean(),
    createdBy: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date()
});

export const adminArticlesRoutes = new Elysia({ prefix: "/articles" })
    .use(permissionsPlugin)
    .get(
        "/",
        async ({ query: { type, status, search, page, pageSize, sort, includeInactive }, ability, set }) => {
            const articleType = type as ArticleType;
            if (ability.cannot("read", `admin.articles.${articleType}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { articleRepository } = db.getRepositories();
            const shouldIncludeInactive = includeInactive && ability.can("manage", `admin.articles.${articleType}`);

            const data = await articleRepository.list({
                type: articleType,
                status: status as ArticleStatus,
                search: search,
                page,
                pageSize,
                sort: (sort as ArticleSortTypes) || "newest",
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
                type: t.Union([t.Literal("blog"), t.Literal("newsletter")]),
                status: t.Optional(t.Union([t.Literal("draft"), t.Literal("published"), t.Literal("url_only")])),
                search: t.Optional(t.String()),
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
                sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest"), t.Literal("views")], { default: "newest" })),
                includeInactive: t.Optional(t.Boolean())
            }),
            response: {
                200: t.Object({
                    items: t.Array(AdminArticleSchema),
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
            if (ability.cannot("create", `admin.articles.${body.type}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { articleRepository } = db.getRepositories();
            const article = await articleRepository.create(body as any, user!.id);
            return {
                ...article,
                _id: article._id.toString()
            };
        },
        {
            body: CreateArticleSchema,
            response: {
                200: AdminArticleSchema,
                403: t.Object({ error: t.String() })
            }
        }
    )
    .get(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            const { articleRepository } = db.getRepositories();
            const article = await articleRepository.findByIdForEdit(id);

            if (!article) {
                set.status = 404;
                return { error: "Not found" };
            }

            if (ability.cannot("read", `admin.articles.${article.type}.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            return {
                ...article,
                _id: article._id.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: AdminArticleSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            }
        }
    )
    .patch(
        "/:id",
        async ({ params: { id }, body, ability, set }) => {
            const { articleRepository } = db.getRepositories();
            const article = await articleRepository.findById(id, { includeInactive: true });

            if (!article) {
                set.status = 404;
                return { error: "Not found" };
            }

            if (!article.isActive) {
                if (ability.can("manage", `admin.articles.${article.type}.${id}`) && body.isActive === true) {
                    body = { isActive: true };
                }
            }

            // Granular permission check
            const fields = Object.keys(body);
            for (const field of fields) {
                if (ability.cannot("update", `admin.articles.${article.type}.${id}`, { field })) {
                    set.status = 403;
                    return { error: `Forbidden: Cannot update field ${field}` };
                }
            }

            const updated = await articleRepository.update(id, body);

            if (!updated) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...updated,
                _id: updated._id.toString()
            };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Partial(CreateArticleSchema),
            response: {
                200: AdminArticleSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            }
        }
    )
    .delete(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            const { articleRepository } = db.getRepositories();
            const article = await articleRepository.findById(id, { includeInactive: true });

            if (!article) {
                set.status = 404;
                return { error: "Not found" };
            }

            if (ability.cannot("delete", `admin.articles.${article.type}.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const success = await articleRepository.delete(id);

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
