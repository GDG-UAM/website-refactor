import { serverApi } from "#/lib/eden-server";
import { cache } from "react";

export const getEvaluationHackathon = cache(async (id: string) => {
    try {
        const { data } = await serverApi.evaluations.hackathons({ id }).get();
        return data || null;
    } catch (e) {
        console.error("Failed to fetch evaluation hackathon:", e);
        return null;
    }
});

export const getEvaluationTrack = cache(async (trackId: string) => {
    try {
        const { data } = await serverApi.evaluations.tracks({ trackId }).get();
        return data || null;
    } catch (e) {
        console.error("Failed to fetch evaluation track:", e);
        return null;
    }
});

export const getEvaluationTeam = cache(async (teamId: string) => {
    try {
        const { data } = await serverApi.evaluations.teams({ teamId }).get();
        return data || null;
    } catch (e) {
        console.error("Failed to fetch evaluation team:", e);
        return null;
    }
});
