import { Elysia, Context, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { csrfPlugin } from "./plugins/csrf";
import { permissionsPlugin } from "./plugins/permissions";
import { auth } from "./lib/auth";
import {
    adminRoutes,
    settingsRoutes,
    userRoutes,
    contactRoutes,
    eventsRoutes,
    articlesRoutes,
    miscRoutes,
    linksRoutes,
    hackathonRoutes,
    badgesRoutes,
    publicCertificateRoutes
} from "./routes";
import db from "./lib/db";
import { initializeDefaults } from "./lib/init";
import { initSentry, Sentry } from "./sentry";

initSentry();

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
    .onError(({ error, set }) => {
        if (![403, 404].includes(set.status as number)) {
            Sentry.captureException(error);
            console.error(error);
        }
    })
    .use(
        cors({
            origin: process.env.FRONTEND_URL || "http://localhost:3001",
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization", "x-xsrf-token", "x-better-auth", "x-internal-secret"]
        })
    )

    .all("/auth/*", betterAuthView)
    .use(csrfPlugin)
    .use(permissionsPlugin)
    .onBeforeHandle(({ path, user, set }: any) => {
        if (path.startsWith("/api/docs") || path.startsWith("/docs")) {
            const allowedRoles = ["team", "organizer", "admin"];
            if (!user || !user.role || !allowedRoles.includes(user.role)) {
                set.status = 401;
                return { error: "Unauthorized" };
            }
        }
    })
    .use(
        swagger({
            path: "/docs",
            documentation: {
                info: {
                    title: "GDG UAM API",
                    version: "1.0.0",
                    description: "GDG UAM API"
                },
                tags: [
                    { name: "General", description: "General endpoints" },
                    { name: "Settings", description: "Settings endpoints" },
                    { name: "Users", description: "User management endpoints" },
                    { name: "Contact", description: "Contact form endpoints" },
                    { name: "Events", description: "Event endpoints" },
                    { name: "Articles", description: "Article endpoints" },
                    { name: "Misc", description: "Miscellaneous endpoints" },
                    { name: "Links", description: "Link management endpoints" },
                    { name: "Badges", description: "Open Badge endpoints" },
                    { name: "Certificates", description: "Public certificate endpoints" },
                    { name: "Hackathons", description: "Hackathon endpoints" },
                    { name: "Admin - Articles", description: "Admin article management" },
                    { name: "Admin - Events", description: "Admin event management" },
                    { name: "Admin - Links", description: "Admin link management" },
                    { name: "Admin - Users", description: "Admin user management" },
                    { name: "Admin - Hackathons", description: "Admin hackathon management" },
                    { name: "Admin - Teams", description: "Admin team management" },
                    { name: "Admin - Certificates", description: "Admin certificate management" }
                ]
            },
            version: "1.0.0",
            autoDarkMode: false,
            scalarConfig: {
                darkMode: false,
                forceDarkModeState: "light",
                hideDarkModeToggle: true,
                layout: "modern",
                telemetry: false,
                searchHotKey: "f",
                theme: "bluePlanet",
                showDeveloperTools: "never",
                hiddenClients: {
                    http: false,
                    javascript: false,
                    node: false,
                    powershell: false,
                    shell: false,
                    c: true,
                    clojure: true,
                    csharp: true,
                    go: true,
                    java: true,
                    kotlin: true,
                    objc: true,
                    ocaml: true,
                    php: true,
                    python: true,
                    r: true,
                    ruby: true,
                    swift: true,
                    // @ts-expect-error definition error, but works properly
                    fsharp: true,
                    rust: true,
                    dart: true
                },
                customCss: "div:has(> a.open-api-client-button) { display: none !important; }"
            }
        })
    )
    .use(adminRoutes)
    .use(settingsRoutes)
    .use(userRoutes)
    .use(contactRoutes)
    .use(eventsRoutes)
    .use(articlesRoutes)
    .use(miscRoutes)
    .use(linksRoutes)
    .use(hackathonRoutes)
    .use(badgesRoutes)
    .use(publicCertificateRoutes)
    .get(
        "/health",
        () => {
            return { status: "ok" as const };
        },
        {
            detail: {
                tags: ["General"]
            },
            response: {
                200: t.Object({ status: t.Literal("ok") })
            }
        }
    );

async function startServer() {
    try {
        await db.connect();
        console.log("[Server] Database connected");
        await initializeDefaults();

        app.listen({ port: parseInt(process.env.BACKEND_PORT || "3001") });
        console.log(`[Server] Listening on port ${process.env.BACKEND_PORT || "3001"}`);
    } catch (err) {
        console.error("[Server] Failed to initialize:", err);
        process.exit(1);
    }
}

startServer();

export type App = typeof app;
export default app;
