import { Elysia } from "elysia";

export const csrfPlugin = (app: Elysia) =>
    app
        .onBeforeHandle(({ request, headers, cookie: { "XSRF-TOKEN": xsrfToken }, set }) => {
            const safeMethods = ["GET", "HEAD", "OPTIONS"];
            const pathname = new URL(request.url).pathname;

            // 1. Skip validation for safe methods
            if (safeMethods.includes(request.method)) {
                return;
            }

            // 2. Skip validation for the CSRF initialization route itself
            if (pathname === "/csrf") {
                return;
            }

            // 3. Skip CSRF validation for internal server-to-server calls
            // Validate shared secret for trusted internal requests
            const internalSecret = headers["x-internal-secret"];
            if (internalSecret && internalSecret === process.env.INTERNAL_API_SECRET) {
                return;
            }

            // 4. Validate Header vs Cookie for browser requests
            const headerToken = headers["x-xsrf-token"];

            if (!headerToken || !xsrfToken.value || headerToken !== xsrfToken.value) {
                set.status = 403;
                return { error: "Invalid or missing CSRF token" };
            }
        })
        .get(
            "/csrf",
            ({ cookie: { "XSRF-TOKEN": xsrfToken } }) => {
                if (!xsrfToken.value) {
                    xsrfToken.set({
                        value: crypto.randomUUID(),
                        path: "/",
                        sameSite: "lax",
                        httpOnly: false, // Must be readable by client JS
                        secure: process.env.NODE_ENV === "production"
                    });
                }
                return { status: "initialized" };
            },
            {
                detail: {
                    tags: ["General"]
                }
            }
        );
