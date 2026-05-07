"use client";

import { useEffect, useState } from "react";
import { api } from "#/lib/eden";
import AdminNavigation from "../admin/AdminNavigation";
import { Container } from "../admin/AdminPage.styles";
import * as m from "#/paraglide/messages";

interface TeamInfo {
    _id: string;
    name: string;
    evaluation: {
        totalScore: number;
    } | null;
}

export function EvaluationTeamsPage({ hackathonId, trackId }: { hackathonId: string, trackId: string }) {
    const [teams, setTeams] = useState<TeamInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { data, error } = await api.evaluations.tracks({ trackId }).teams.get();
                if (error) throw error;
                if (data) setTeams(data as any);
            } catch (e) {
                console.error("Failed to load teams:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [trackId]);

    if (loading) return <Container>{m["evaluations.loading"]()}</Container>;

    const unevaluated = teams.filter(t => !t.evaluation);
    const evaluated = teams.filter(t => t.evaluation);

    const categories = [
        {
            title: m["evaluations.notEvaluated"](),
            buttons: unevaluated.map(t => ({
                label: t.name,
                type: "hackathon-teams" as const,
                href: `/evaluations/${hackathonId}/${trackId}/${t._id}`,
                noTranslate: true
            }))
        },
        {
            title: m["evaluations.evaluated"](),
            buttons: evaluated.map(t => ({
                label: `(${t.evaluation!.totalScore.toFixed(1)}★) ${t.name}`,
                type: "hackathon-teams" as const,
                href: `/evaluations/${hackathonId}/${trackId}/${t._id}`,
                noTranslate: true
            }))
        }
    ];

    return (
        <AdminNavigation
            title={m["evaluations.pageTitle"]()}
            categories={categories}
        />
    );
}
