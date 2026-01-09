import { Elysia, Context } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { csrfPlugin } from "./plugins/csrf";
import { permissionsPlugin } from "./plugins/permissions";
import { auth } from "./lib/auth";
import { adminRoutes, settingsRoutes, userRoutes, contactRoutes, eventsRoutes, articlesRoutes, miscRoutes, linksRoutes, hackathonRoutes } from "./routes";
import db from "./lib/db";
import { initializeDefaults } from "./lib/init";

// Initialize database and defaults on startup
db.connect()
    .then(async () => {
        console.log("[Server] Database connected");
        await initializeDefaults();
    })
    .catch((err) => {
        console.error("[Server] Failed to initialize:", err);
    });

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
            allowedHeaders: ["Content-Type", "Authorization", "x-xsrf-token", "x-better-auth", "x-internal-secret"]
        })
    )
    .use(
        swagger({
            path: "/docs",
            documentation: {
                info: {
                    title: "GDG UAM API",
                    version: "1.0.0",
                    description: "GDG UAM API"
                }
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
    .all("/auth/*", betterAuthView)
    .use(csrfPlugin)
    .use(permissionsPlugin)
    .use(adminRoutes)
    .use(settingsRoutes)
    .use(userRoutes)
    .use(contactRoutes)
    .use(eventsRoutes)
    .use(articlesRoutes)
    .use(miscRoutes)
    .use(linksRoutes)
    .use(hackathonRoutes)
    .listen(process.env.PORT || 3000);

export type App = typeof app;
export default app;
