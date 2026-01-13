import { serverApi } from "#/lib/eden-server";
import { cache } from "react";
import { canManageResource } from "#/lib/permissions/server";

export const getHackathon = cache(async (id: string) => {
    try {
        const { data: hackathon } = await serverApi.admin.hackathons({ id }).get();

        if (!hackathon) {
            return null;
        }

        if (hackathon.isActive === false) {
            const canManage = await canManageResource(`admin.hackathons.${id}`);

            if (!canManage) {
                return null;
            }
        }

        return hackathon;
    } catch (e) {
        console.error("Failed to fetch hackathon:", e);
        return null;
    }
});

export const getTrack = cache(async (id: string, trackId: string) => {
    try {
        const hackathon = await getHackathon(id);

        if (!hackathon) {
            return null;
        }

        const { data: track } = await serverApi.admin.hackathons({ id }).tracks({ trackId }).get();

        if (!track) {
            return null;
        }

        if (track.isActive === false) {
            const canManage = await canManageResource(`admin.hackathons.${id}.tracks.${trackId}`);

            if (!canManage) {
                return null;
            }
        }

        return track;
    } catch (e) {
        console.error("Failed to fetch track:", e);
        return null;
    }
});

export const getTeam = cache(async (id: string) => {
    try {
        const { data: team } = await serverApi.admin.teams({ id }).get();

        if (!team) {
            return null;
        }

        if (team.isActive === false) {
            const canManage = await canManageResource(`admin.hackathons.${team.hackathonId}.teams.${id}`);

            if (!canManage) {
                return null;
            }
        }

        return team;
    } catch (e) {
        console.error("Failed to fetch team:", e);
        return null;
    }
});
