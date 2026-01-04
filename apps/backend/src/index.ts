import { Elysia, Context } from "elysia";
import { cors } from "@elysiajs/cors";
import { csrfPlugin } from "./plugins/csrf";
import { permissionsPlugin } from "./plugins/permissions";
import { auth } from "./lib/auth";
import { checkPermission } from "./lib/permissions";

const betterAuthView = (context: Context) => {
    const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];
    if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
        return auth.handler(context.request);
    } else {
        context.set.status = 405;
        return { error: "Method Not Allowed" };
    }
};

const app = new Elysia({ prefix: "/api" })
    .use(
        cors({
            origin: process.env.FRONTEND_URL || "http://localhost:3001",
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization", "x-xsrf-token", "x-better-auth", "x-internal-secret", "x-organization-id"]
        })
    )
    .all("/auth/*", betterAuthView)
    .use(csrfPlugin)
    // .derive(async ({ request }) => {
    //     // Better Auth can parse the session from the request
    //     const session = await auth.api.getSession({
    //         headers: request.headers
    //     });

    //     return {
    //         user: session?.user ?? null,
    //         session: session?.session ?? null
    //     };
    // })
    .use(permissionsPlugin)
    .get("/me", ({ user, set }) => {
        if (!user) {
            set.status = 401;
            return { error: "Not logged in" };
        }
        return { user };
    })
    .get("/organizations", async ({ user, set, request }) => {
        if (!user) {
            set.status = 401;
            return { error: "Not logged in" };
        }

        const orgs = await auth.api.listOrganizations({
            headers: request.headers
        });

        return { organizations: orgs };
    })
    // Example protected route using CASL permissions
    .post("/posts", ({ user, ability, set, body }) => {
        if (!user) {
            set.status = 401;
            return { error: "Not logged in" };
        }

        try {
            // Check if user can create posts
            checkPermission(ability, "create", "Post");

            // Your logic to create a post
            return {
                success: true,
                message: "Post created",
                post: body
            };
        } catch (error: unknown) {
            set.status = 403;
            return { error: (error as Error).message };
        }
    })
    .get("/posts/:id", ({ params, ability, set }) => {
        try {
            // Check if user can read posts
            checkPermission(ability, "read", "Post");

            // Your logic to fetch the post
            return {
                success: true,
                post: { id: params.id, title: "Example Post" }
            };
        } catch (error: unknown) {
            set.status = 403;
            return { error: (error as Error).message };
        }
    })
    .post("/", () => "Hello Elysia")
    .post("/test", () => ({ success: true }));

// The way the server is run makes this redundant
// app.listen({
//     port: Number(process.env.BACKEND_PORT) || 3000,
//     hostname: "0.0.0.0"
// });

export type App = typeof app;
export default app;
