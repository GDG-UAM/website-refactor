import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";
import type { ArticleType, ArticleStatus } from "../../repositories/types";

const AdminArticleSchema = t.Object({
    _id: t.String(),
    type: t.Union([t.Literal("blog"), t.Literal("newsletter")]),
    title: t.Record(t.String(), t.String()),
    slug: t.String(),
    excerpt: t.Optional(t.Record(t.String(), t.String())),
    content: t.Record(t.String(), t.String()),
    coverImage: t.Optional(t.String()),
    coverImageBlurHash: t.Optional(t.String()),
    coverImageWidth: t.Optional(t.Number()),
    coverImageHeight: t.Optional(t.Number()),
    status: t.String(),
    authors: t.Array(t.String()),
    views: t.Number(),
    publishedAt: t.Optional(t.Nullable(t.Date())),
    createdBy: t.String()
});

const CreateArticleSchema = t.Object({
    type: t.Union([t.Literal("blog"), t.Literal("newsletter")]),
    title: t.Record(t.String(), t.String()),
    slug: t.Optional(t.String()),
    excerpt: t.Optional(t.Record(t.String(), t.String())),
    content: t.Record(t.String(), t.String()),
    coverImage: t.Optional(t.String()),
    status: t.Union([t.Literal("draft"), t.Literal("published"), t.Literal("url_only")]),
    authors: t.Array(t.String()),
    publishedAt: t.Optional(t.Date())
});

export const adminArticlesRoutes = new Elysia({ prefix: "/articles" })
    .use(permissionsPlugin)
    .get(
        "/",
        async ({ query: { type, status, q, page, pageSize, sort }, ability, set }) => {
            if (ability.cannot("read", "articles")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { articleRepository } = db.getRepositories();
            const data = await articleRepository.list({
                type: type as ArticleType,
                status: status as ArticleStatus,
                search: q,
                page,
                pageSize,
                sort: sort || "newest",
                includeInactive: false
            });

            return {
                ...data,
                items: data.items.map((item) => {
                    return {
                        ...item,
                        _id: item._id.toString()
                    };
                })
            };
        },
        {
            response: {
                200: t.Object({
                    items: t.Array(AdminArticleSchema),
                    total: t.Number(),
                    page: t.Number(),
                    pageSize: t.Number()
                }),
                403: t.Object({ error: t.String() })
            },
            query: t.Object({
                type: t.Optional(t.Union([t.Literal("newsletter"), t.Literal("blog")])),
                status: t.Optional(t.String()),
                q: t.Optional(t.String()),
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
                sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest")], { default: "newest" }))
            })
        }
    )
    .post(
        "/",
        async ({ body, ability, user, set }) => {
            if (ability.cannot("create", "articles")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { articleRepository } = db.getRepositories();
            const article = await articleRepository.create(body, user!.id);
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
            if (ability.cannot("read", `articles.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { articleRepository } = db.getRepositories();
            const article = await articleRepository.findByIdForEdit(id);

            if (!article) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...article,
                _id: article._id.toString()
            };
        },
        {
            response: {
                200: AdminArticleSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            params: t.Object({ id: t.String() })
        }
    )
    .patch(
        "/:id",
        async ({ params: { id }, body, ability, set }) => {
            // Granular permission check
            const fields = Object.keys(body);
            for (const field of fields) {
                if (ability.cannot("update", `articles.${id}.${field}`)) {
                    set.status = 403;
                    return { error: `Forbidden: Cannot update field ${field}` };
                }
            }

            const { articleRepository } = db.getRepositories();
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
            response: {
                200: AdminArticleSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            params: t.Object({ id: t.String() }),
            body: t.Partial(CreateArticleSchema)
        }
    )
    .delete(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("delete", `articles.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { articleRepository } = db.getRepositories();
            const success = await articleRepository.delete(id);

            if (!success) {
                set.status = 404;
                return { error: "Not found" };
            }

            return { success: true };
        },
        {
            response: {
                200: t.Object({ success: t.Boolean() }),
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            params: t.Object({ id: t.String() })
        }
    );
