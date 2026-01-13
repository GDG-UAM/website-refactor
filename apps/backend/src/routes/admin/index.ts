import { Elysia } from "elysia";
import { adminArticlesRoutes } from "./articles";
import { adminEventsRoutes } from "./events";
import { adminLinksRoutes } from "./links";
import { adminUsersRoutes } from "./users";
import { adminHackathonsRoutes } from "./hackathons";
import { adminTeamsRoutes } from "./teams";

export const adminRoutes = new Elysia({ prefix: "/admin" })
    .use(adminArticlesRoutes)
    .use(adminEventsRoutes)
    .use(adminLinksRoutes)
    .use(adminUsersRoutes)
    .use(adminHackathonsRoutes)
    .use(adminTeamsRoutes);
