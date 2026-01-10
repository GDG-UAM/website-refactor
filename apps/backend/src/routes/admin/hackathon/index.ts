import { Elysia } from "elysia";
import { adminTracksRoutes } from "./tracks";

export const adminHackathonRoutes = new Elysia().use(adminTracksRoutes);
