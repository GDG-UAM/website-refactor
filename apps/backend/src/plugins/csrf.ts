import { Elysia } from "elysia";

export const csrfPlugin = new Elysia({ name: "csrf" })
  .onBeforeHandle(
    ({ request, headers, cookie: { "XSRF-TOKEN": xsrfToken }, set }) => {
      const safeMethods = ["GET", "HEAD", "OPTIONS"];

      // 1. Skip validation for safe methods
      if (safeMethods.includes(request.method)) return;

      // 2. Skip validation for the CSRF initialization route itself
      if (new URL(request.url).pathname === "/api/csrf") return;

      // 3. Validate Header vs Cookie
      const headerToken = headers["x-xsrf-token"];

      if (!headerToken || !xsrfToken.value || headerToken !== xsrfToken.value) {
        set.status = 403;
        return { error: "Invalid or missing CSRF token" };
      }
    },
  )
  .get("/csrf", ({ cookie: { "XSRF-TOKEN": xsrfToken } }) => {
    if (!xsrfToken.value) {
      xsrfToken.set({
        value: crypto.randomUUID(),
        path: "/",
        sameSite: "lax",
        httpOnly: false, // Must be readable by client JS
        secure: process.env.NODE_ENV === "production",
      });
    }
    return { status: "initialized" };
  });
