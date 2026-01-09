import { serverApi } from "#/lib/eden-server";
import { cache } from "react";

export const getHackathon = cache(async (id: string) => {
    try {
        const { data: hackathon } = await serverApi.admin.hackathons({ id }).get();
        return hackathon ?? null;
    } catch (e) {
        console.error("Failed to fetch hackathon:", e);
        return null;
    }
});
