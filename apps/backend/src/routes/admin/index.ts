import { Elysia } from "elysia";
import { adminArticlesRoutes } from "./articles";
import { adminEventsRoutes } from "./events";
import { adminLinksRoutes } from "./links";

export const adminRoutes = new Elysia({ prefix: "/admin" }).use(adminArticlesRoutes).use(adminEventsRoutes).use(adminLinksRoutes);
