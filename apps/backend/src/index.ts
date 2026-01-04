import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { csrfPlugin } from "./plugins/csrf";

const app = new Elysia()
  .use(cors())
  .use(csrfPlugin)
  .post("/", () => "Hello Elysia")
  .post("/test", () => ({ success: true }))
  .listen(process.env.BACKEND_PORT || 3000);

export type App = typeof app;
export default app;
