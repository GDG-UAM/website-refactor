import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";

const AdminUserSchema = t.Object({
    _id: t.String(),
    name: t.String(),
    email: t.String(),
    image: t.Optional(t.Nullable(t.String())),
    role: t.String(),
    displayName: t.Optional(t.Nullable(t.String())),
    templatesUsed: t.Optional(t.Array(t.String())),
    individualPermissions: t.Optional(
        t.Array(
            t.Object({
                resource: t.String(),
                actions: t.Array(t.String()),
                effect: t.Union([t.Literal("allow"), t.Literal("deny")]),
                conditions: t.Optional(t.Record(t.String(), t.Any()))
            })
        )
    ),
    createdAt: t.Optional(t.Union([t.Date(), t.String()])),
    updatedAt: t.Optional(t.Union([t.Date(), t.String()]))
});

export const adminUsersRoutes = new Elysia({ prefix: "/users" })
    .use(permissionsPlugin)
    .get(
        "/",
        async ({ query: { page, pageSize, search, roles }, ability, set }) => {
            if (ability.cannot("read", "admin.users") && ability.cannot("read", "admin.events")) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { userRepository } = db.getRepositories();

            const data = await userRepository.list({
                page,
                pageSize,
                search,
                roles
            });

            return {
                ...data,
                items: data.items.map((item) => ({
                    ...item,
                    _id: item._id.toString(),
                    image: item.image ?? undefined,
                    role: item.role ?? "user",
                    displayName: item.displayName ?? undefined
                }))
            };
        },
        {
            query: t.Object({
                page: t.Optional(t.Number({ default: 1, minimum: 1 })),
                pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
                search: t.Optional(t.String()),
                roles: t.Optional(t.Array(t.Union([t.Literal("user"), t.Literal("team"), t.Literal("organizer")])))
            }),
            response: {
                200: t.Object({
                    items: t.Array(AdminUserSchema),
                    total: t.Number(),
                    page: t.Number(),
                    pageSize: t.Number()
                }),
                403: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Users"]
            }
        }
    )
    .get(
        "/:id",
        async ({ params: { id }, ability, set }) => {
            if (ability.cannot("read", `admin.users.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { userRepository } = db.getRepositories();
            const user = await userRepository.findById(id);

            if (!user) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...user,
                _id: user._id.toString(),
                image: user.image ?? undefined,
                role: user.role ?? "user",
                displayName: user.displayName ?? undefined,
                templatesUsed: user.templatesUsed || [],
                individualPermissions: user.individualPermissions || []
            };
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: AdminUserSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Users"]
            }
        }
    )
    .patch(
        "/:id",
        async ({ params: { id }, body, ability, set }) => {
            if (ability.cannot("update", `admin.users.${id}`)) {
                set.status = 403;
                return { error: "Forbidden" };
            }

            const { userRepository } = db.getRepositories();
            const updated = await userRepository.update(id, body as any);

            if (!updated) {
                set.status = 404;
                return { error: "Not found" };
            }

            return {
                ...updated,
                _id: updated._id.toString(),
                image: updated.image ?? undefined,
                role: updated.role ?? "user",
                displayName: updated.displayName ?? undefined,
                templatesUsed: updated.templatesUsed || [],
                individualPermissions: updated.individualPermissions || []
            };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Partial(t.Omit(AdminUserSchema, ["_id"])),
            response: {
                200: AdminUserSchema,
                403: t.Object({ error: t.String() }),
                404: t.Object({ error: t.String() })
            },
            detail: {
                tags: ["Admin - Users"]
            }
        }
    );
