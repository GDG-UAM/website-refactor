import { Elysia } from "elysia";
import { adminArticlesRoutes } from "./articles";
import { adminEventsRoutes } from "./events";
import { adminLinksRoutes } from "./links";
import { adminUsersRoutes } from "./users";
import { adminPermissionsRoutes } from "./permissions";
import { adminHackathonsRoutes } from "./hackathons";
import { adminTeamsRoutes } from "./teams";
import { adminCertificatesRoutes } from "./certificates";

export const adminRoutes = new Elysia({ prefix: "/admin" })
    .use(adminArticlesRoutes)
    .use(adminEventsRoutes)
    .use(adminLinksRoutes)
    .use(adminUsersRoutes)
    .use(adminPermissionsRoutes)
    .use(adminHackathonsRoutes)
    .use(adminTeamsRoutes)
    .use(adminCertificatesRoutes);
