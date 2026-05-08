"use client";

import { useEffect, useState } from "react";
import { api } from "#/lib/eden";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import { newErrorToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import styled from "styled-components";
import { useRegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";

const TeamInfo = styled.div`
    background: var(--card-bg);
    padding: 32px;
    border-radius: 16px;
    margin-bottom: 40px;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    
    h3 { 
        margin-bottom: 16px; 
        font-size: 2.2rem;
        font-weight: 900;
        color: var(--text-primary);
        letter-spacing: -0.02em;
    }
    .description { 
        color: var(--text-secondary); 
        white-space: pre-wrap;
        line-height: 1.7;
        font-size: 1.15rem;
    }
`;

const EvaluationCard = styled.div`
    background: var(--card-bg);
    padding: 28px;
    border-radius: 16px;
    margin-bottom: 28px;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .judge-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border-color);

        .judge-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .judge-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                background: var(--border-color);
            }

            .judge-name {
                font-weight: 700;
                font-size: 1.15rem;
                color: var(--text-primary);
            }
        }

        .total-score {
            font-size: 1.3rem;
            font-weight: 900;
            color: var(--primary-color);
            background: rgba(var(--primary-rgb), 0.08);
            padding: 6px 16px;
            border-radius: 10px;
            font-variant-numeric: tabular-nums;
        }
    }

    .scores-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 20px;
        margin-bottom: 24px;
    }

    .score-item {
        background: rgba(0, 0, 0, 0.015);
        padding: 12px 16px;
        border-radius: 10px;
        border: 1px solid transparent;
        transition: border-color 0.2s ease;

        &:hover {
            border-color: rgba(var(--primary-rgb), 0.2);
        }

        .label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-secondary);
            margin-bottom: 6px;
            font-weight: 700;
        }
        .value {
            font-weight: 700;
            color: var(--text-primary);
            font-size: 1.1rem;
        }
    }

    .notes {
        background: rgba(var(--primary-rgb), 0.03);
        padding: 20px;
        border-radius: 12px;
        font-style: italic;
        color: var(--text-secondary);
        font-size: 1rem;
        line-height: 1.6;
        border-left: 4px solid var(--primary-color);
    }
`;

const InnerContainer = styled.div`
    max-width: 1000px;
    margin: 40px auto;
`;

interface EvaluationDetail {
    judgeName: string;
    judgeImage: string | null;
    scores: Record<string, number>;
    totalScore: number;
    notes: string;
    createdAt: Date | string;
}

interface TeamDetail {
    name: string;
    description: string;
    evaluations: EvaluationDetail[];
}

export function AdminTeamLeaderboardDetailPage({ hackathonId, trackId, teamId, trackName }: { hackathonId: string, trackId: string, teamId: string, trackName?: string }) {
    const [data, setData] = useState<TeamDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useRegisterBreadcrumbs([
        { label: trackName || trackId, noTranslate: !!trackName },
        { label: m["evaluations.leaderboard"](), href: `/admin/hackathons/${hackathonId}/tracks/${trackId}/leaderboard` },
        { label: data?.name || teamId, noTranslate: !!data?.name }
    ]);

    useEffect(() => {
        async function load() {
            try {
                const { data: detailData, error } = await api.admin.hackathons({ id: hackathonId }).tracks({ trackId }).leaderboard.teams({ teamId }).get();
                if (error) throw error;
                if (detailData) setData(detailData as any);
            } catch (e) {
                console.error("Failed to load team details:", e);
                newErrorToast(m["evaluations.form.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [hackathonId, trackId, teamId]);

    if (loading) return <Container>{m["evaluations.form.loading"]()}</Container>;
    if (!data) return <Container>{m["evaluations.form.teamNotFound"]()}</Container>;

    const linkify = (text?: string) => {
        if (!text) return <span style={{ opacity: 0.5 }}>{m["evaluations.form.noDescription"]()}</span>;
        const urlRegex = /(https?:\/\/[^\s,;()<>]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)", textDecoration: "underline" }}>
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    return (
        <Container>
            <Header>
                <Title>{m["evaluations.viewTeam"]()}</Title>
            </Header>

            <InnerContainer>
                <TeamInfo>
                    <h3 style={{ marginTop: 0 }} data-no-ai-translate>{data.name}</h3>
                    <div className="description" data-no-ai-translate>
                        {linkify(data.description)}
                    </div>
                </TeamInfo>

                <h2 style={{ marginBottom: "24px", fontSize: "1.5rem", fontWeight: 700 }}>
                    {m["evaluations.evaluated"]()} ({data.evaluations.length})
                </h2>

                {data.evaluations.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>
                        {m["evaluations.notEvaluated"]()}
                    </div>
                ) : (
                    data.evaluations.map((evalItem, idx) => (
                        <EvaluationCard key={idx}>
                            <div className="judge-header">
                                <div className="judge-info">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={evalItem.judgeImage || "/logo/32x32.webp"} 
                                        alt={evalItem.judgeName} 
                                        className="judge-avatar" 
                                    />
                                    <div className="judge-name" data-no-ai-translate>{evalItem.judgeName}</div>
                                </div>
                                <div className="total-score">{evalItem.totalScore.toFixed(2)} ★</div>
                            </div>

                            <div className="scores-grid">
                                {Object.entries(evalItem.scores).map(([criterion, score]) => (
                                    <div className="score-item" key={criterion}>
                                        <div className="label" data-no-ai-translate>{criterion}</div>
                                        <div className="value">{score} / 5</div>
                                    </div>
                                ))}
                            </div>

                            {evalItem.notes && (
                                <div className="notes" data-no-ai-translate>
                                    "{evalItem.notes}"
                                </div>
                            )}
                        </EvaluationCard>
                    ))
                )}
            </InnerContainer>
        </Container>
    );
}
