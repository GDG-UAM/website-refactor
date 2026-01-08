import { Elysia } from "elysia";
import { adminArticlesRoutes } from "./articles";
import { adminEventsRoutes } from "./events";

export const adminRoutes = new Elysia({ prefix: "/admin" }).use(adminArticlesRoutes).use(adminEventsRoutes);
