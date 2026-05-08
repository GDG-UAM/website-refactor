"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, customColumn } from "#/components/pages/admin/AdminTableFactories";
import { ViewButton } from "#/components/Buttons";
import { newErrorToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";

interface LeaderboardTeam {
    _id: string;
    name: string;
    averageScore: number;
    evaluationsCount: number;
}

interface AdminTrackLeaderboardPageProps {
    hackathonId: string;
    trackId: string;
    trackName?: string;
}

export function AdminTrackLeaderboardPage({ hackathonId, trackId, trackName }: AdminTrackLeaderboardPageProps) {
    const router = useRouter();

    useRegisterBreadcrumbs([
        { label: trackName || trackId, noTranslate: !!trackName },
        { label: m["evaluations.leaderboard"]() }
    ]);

    const [rows, setRows] = useState<LeaderboardTeam[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await api.admin.hackathons({ id: hackathonId }).tracks({ trackId }).leaderboard.get();

            if (!error && data) {
                // Sort by average score descending
                const sorted = [...data].sort((a, b) => b.averageScore - a.averageScore);
                setRows(sorted);
            } else {
                throw new Error("Failed to load leaderboard");
            }
        } catch (e) {
            console.error("Failed to load leaderboard:", e);
            newErrorToast(m["evaluations.form.toasts.loadError"]());
        } finally {
            setLoading(false);
        }
    }, [hackathonId, trackId]);

    useEffect(() => {
        load();
    }, [load]);

    const columns = useMemo(
        () => [
            textColumn<LeaderboardTeam>("name", m["evaluations.teamName"](), (r) => r.name, { bold: true, noTranslate: true }),
            customColumn<LeaderboardTeam>("score", m["evaluations.averageRating"](), (r) => (
                <div style={{ fontWeight: 500 }}>
                    {r.averageScore.toFixed(2)}★ <span style={{ opacity: 0.7, fontWeight: 400 }}>({r.evaluationsCount})</span>
                </div>
            ))
        ],
        []
    );

    return (
        <Container>
            <Header>
                <Title>
                    {m["evaluations.leaderboard"]()} - <span data-no-ai-translate>{trackName || trackId}</span>
                </Title>
            </Header>

            <AdminTable
                columns={columns}
                data={rows}
                loading={loading}
                onReload={load}
                reloadLabel={m["admin.hackathons.tracks.list.reload"]()}
                emptyMessage={m["admin.hackathons.tracks.list.noTracks"]()}
                rowActions={(row) => (
                    <ViewButton
                        onClick={() => router.push(`/admin/hackathons/${hackathonId}/tracks/${trackId}/leaderboard/${row._id}`)}
                        ariaLabel="View team details"
                        iconSize={20}
                    />
                )}
            />
        </Container>
    );
}
