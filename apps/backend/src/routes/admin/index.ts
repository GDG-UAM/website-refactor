import { Elysia } from "elysia";
import { adminArticlesRoutes } from "./articles";
import { adminEventsRoutes } from "./events";
import { adminLinksRoutes } from "./links";
import { adminUsersRoutes } from "./users";

export const adminRoutes = new Elysia({ prefix: "/admin" }).use(adminArticlesRoutes).use(adminEventsRoutes).use(adminLinksRoutes).use(adminUsersRoutes);
