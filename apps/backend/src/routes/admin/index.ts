import { Elysia } from "elysia";
import { permissionTemplateRoutes } from "./permission-templates";
import { permissionRoutes } from "./permissions";

export const adminRoutes = new Elysia({ prefix: "/admin" }).use(permissionTemplateRoutes).use(permissionRoutes);
