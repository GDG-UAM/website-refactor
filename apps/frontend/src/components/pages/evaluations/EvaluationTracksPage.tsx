"use client";

import { useEffect, useState } from "react";
import { api } from "#/lib/eden";
import AdminNavigation from "../admin/AdminNavigation";
import { Container } from "../admin/AdminPage.styles";
import * as m from "#/paraglide/messages";

interface TrackInfo {
    _id: string;
    name: string;
    isJudge: boolean;
}

export function EvaluationTracksPage({ hackathonId }: { hackathonId: string }) {
    const [tracks, setTracks] = useState<TrackInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { data, error } = await api.evaluations.hackathons({ id: hackathonId }).tracks.get();
                if (error) throw error;
                if (data) setTracks(data as any);
            } catch (e) {
                console.error("Failed to load tracks:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [hackathonId]);

    if (loading) return <Container>{m["evaluations.tracksLoading"]()}</Container>;

    const judgeTracks = tracks.filter(t => t.isJudge);
    const otherTracks = tracks.filter(t => !t.isJudge);

    const categories = [
        {
            title: m["evaluations.yourTracks"](),
            buttons: judgeTracks.map(t => ({
                label: t.name,
                type: "hackathon-tracks" as const,
                href: `/evaluations/${hackathonId}/${t._id}`,
                noTranslate: true
            }))
        }
    ];

    if (otherTracks.length > 0) {
        categories.push({
            title: m["evaluations.otherTracks"](),
            buttons: otherTracks.map(t => ({
                label: t.name,
                type: "hackathon-tracks" as const,
                href: `/evaluations/${hackathonId}/${t._id}`,
                disabled: true,
                noTranslate: true
            }))
        });
    }

    return (
        <AdminNavigation
            title={m["evaluations.pageTitle"]()}
            categories={categories}
        />
    );
}
