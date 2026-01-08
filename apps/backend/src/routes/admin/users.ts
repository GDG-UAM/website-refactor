import { Elysia, t } from "elysia";
import db from "../../lib/db";
import { permissionsPlugin } from "../../plugins/permissions";

const AdminUserSchema = t.Object({
    _id: t.String(),
    name: t.String(),
    email: t.String(),
    image: t.Optional(t.String()),
    role: t.String(),
    displayName: t.Optional(t.String())
});

export const adminUsersRoutes = new Elysia({ prefix: "/users" }).use(permissionsPlugin).get(
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
        }
    }
);
