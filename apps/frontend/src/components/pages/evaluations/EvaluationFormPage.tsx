"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { Container as AdminContainer, Header, Title } from "../admin/AdminPage.styles";
import { SaveButton, CancelButton, DeleteButton } from "#/components/Buttons";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import { TextField } from "@mui/material";
import * as m from "#/paraglide/messages";
import styled from "styled-components";

const TeamInfo = styled.div`
    background: var(--card-bg);
    padding: 32px;
    padding-top: 0;
    border-radius: 12px;
    margin-bottom: 32px;
    border: 1px solid var(--border-color);
    
    h3 { 
        margin-bottom: 12px; 
        font-size: 2rem;
        font-weight: 800;
        color: var(--text-primary);
    }
    .description { 
        margin-bottom: 16px; 
        color: var(--text-secondary); 
        white-space: pre-wrap;
        line-height: 1.6;
        font-size: 1.1rem;
    }
`;

const RubricTable = styled.table`
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-bottom: 40px;
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    overflow: hidden;

    th, td {
        padding: 16px 24px;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }

    th {
        background: rgba(0, 0, 0, 0.02);
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .weight-col { width: 120px; text-align: center; color: var(--text-secondary); }
    .score-col { width: 140px; text-align: right; }
    
    tr:last-child td { border-bottom: none; }

    .total-row {
        background: rgba(0, 0, 0, 0.02);
        font-weight: 700;
        
        td { border-bottom: none; }
        .label { text-align: right; text-transform: uppercase; font-size: 0.8rem; color: var(--text-secondary); }
        .value { 
            color: var(--primary-color);
            font-size: 1.4rem;
            font-variant-numeric: tabular-nums;
        }
    }
`;

const InnerContainer = styled.div`
    max-width: 900px;
    margin: 40px auto 0 auto;
`;

const NotesSection = styled.div`
    margin-bottom: 40px;
    
    label {
        display: block;
        font-weight: 700;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-secondary);
        margin-bottom: 12px;
    }
`;

const Actions = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 60px;
`;

const Container = styled(AdminContainer)`
    max-width: 1200px;
`;

interface RubricEntry {
    name: string;
    weight: number;
}

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

export function EvaluationFormPage({ hackathonId, trackId, teamId }: { hackathonId: string, trackId: string, teamId: string }) {
    const router = useRouter();
    const [team, setTeam] = useState<any>(null);
    const [rubric, setRubric] = useState<RubricEntry[]>([]);
    const [scores, setScores] = useState<Record<string, number | undefined>>({});
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                // Fetch track for rubric
                const { data: trackData, error: trackError } = await api.evaluations.hackathons({ id: hackathonId }).tracks.get();
                if (trackError || !trackData) throw new Error("Failed to load track data");
                
                const currentTrack = (trackData as any[]).find((t: any) => t._id === trackId);
                if (currentTrack) setRubric(currentTrack.rubric);

                // Fetch team info
                const { data: teamsData, error: teamsError } = await api.evaluations.tracks({ trackId }).teams.get();
                if (teamsError || !teamsData) throw new Error("Failed to load teams data");
                
                const currentTeam = (teamsData as any[]).find((t: any) => t._id === teamId);
                if (currentTeam) setTeam(currentTeam);

                // Fetch existing evaluation
                const { data: evalData, error: evalError } = await api.evaluations.teams({ teamId }).evaluation.get();
                if (!evalError && evalData && "scores" in evalData && evalData.scores && Object.keys(evalData.scores).length > 0) {
                    setScores(evalData.scores);
                    if ("notes" in evalData && evalData.notes) setNotes(evalData.notes);
                    setHasExistingEvaluation(true);
                } else {
                    // Initialize scores as undefined to show placeholders initially
                    const initialScores: Record<string, number | undefined> = {};
                    currentTrack?.rubric.forEach((r: any) => {
                        initialScores[r.name] = undefined;
                    });
                    setScores(initialScores);
                }
            } catch (e) {
                console.error("Failed to load evaluation data:", e);
                newErrorToast(m["evaluations.form.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [hackathonId, trackId, teamId]);

    const handleSubmit = async () => {
        try {
            // Ensure all scores are clamped to [0, 5] range before submission
            // Treat undefined scores as 0
            const sanitizedScores = Object.fromEntries(
                Object.entries(scores).map(([k, v]) => [k, Math.min(5, Math.max(0, v ?? 0))])
            );
            const { error } = await api.evaluations.teams({ teamId }).evaluation.post({ scores: sanitizedScores, notes });
            if (!error) {
                newSuccessToast(m["evaluations.form.toasts.submitSuccess"]());
                router.push(`/evaluations/${hackathonId}/${trackId}`);
                router.refresh();
            } else {
                throw new Error("Failed to submit evaluation");
            }
        } catch (e) {
            console.error("Submit error:", e);
            newErrorToast(m["evaluations.form.toasts.submitError"]());
        }
    };

    const handleDelete = async () => {
        try {
            const { error } = await api.evaluations.teams({ teamId }).evaluation.delete();
            if (!error) {
                newSuccessToast(m["evaluations.form.toasts.deleteSuccess"]());
                router.push(`/evaluations/${hackathonId}/${trackId}`);
                router.refresh();
            } else {
                throw new Error("Failed to delete evaluation");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(m["evaluations.form.toasts.deleteError"]());
        }
    };

    if (loading) return <Container>{m["evaluations.form.loading"]()}</Container>;
    if (!team) return <Container>{m["evaluations.form.teamNotFound"]()}</Container>;

    const totalWeight = rubric.reduce((acc, r) => acc + r.weight, 0);
    const totalScore = totalWeight > 0 
        ? rubric.reduce((acc, r) => acc + (scores[r.name] || 0) * r.weight, 0) / totalWeight
        : 0;

    return (
        <Container>
            <Header>
                <Title>{m["evaluations.form.title"]()}</Title>
            </Header>

            <InnerContainer>
                <TeamInfo>
                    <h3 data-no-ai-translate>{team.name}</h3>
                    <div className="description" data-no-ai-translate>
                        {linkify(team.description)}
                    </div>
                </TeamInfo>

                <RubricTable>
                    <thead>
                        <tr>
                            <th>{m["evaluations.form.criterion"]()}</th>
                            <th className="weight-col">{m["evaluations.form.weight"]()}</th>
                            <th className="score-col">{m["evaluations.form.inputScore"]()}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rubric.map((item) => (
                            <tr key={item.name}>
                                <td data-no-ai-translate>{item.name}</td>
                                <td className="weight-col" data-no-ai-translate>{item.weight}</td>
                                <td className="score-col">
                                    <TextField
                                        type="number"
                                        placeholder="0"
                                        value={scores[item.name] ?? ""}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val === "") {
                                                setScores(s => ({ ...s, [item.name]: undefined }));
                                                return;
                                            }
                                            
                                            // Handle leading zeros: 003 -> 3, 000.1 -> 0.1
                                            // We remove leading zeros only if they are followed by another digit
                                            if (val.length > 1 && val.startsWith('0')) {
                                                val = val.replace(/^0+(?=\d)/, '');
                                            }

                                            let num = Number(val);
                                            if (isNaN(num)) return;
                                            
                                            // Silently clamp values to valid range [0, 5]
                                            if (num > 5) num = 5;
                                            if (num < 0) num = 0;
                                            
                                            setScores(s => ({ ...s, [item.name]: num }));
                                        }}
                                        onBlur={(e) => {
                                            // Ensure field is explicitly set to 0 if empty on exit
                                            if (e.target.value === "" || isNaN(Number(e.target.value))) {
                                                setScores(s => ({ ...s, [item.name]: 0 }));
                                            }
                                        }}
                                        inputProps={{
                                            min: "0",
                                            max: "5",
                                            step: "1",
                                        }}
                                        fullWidth
                                    />
                                </td>
                            </tr>
                        ))}
                        <tr className="total-row">
                            <td colSpan={2} className="label">{m["evaluations.form.totalScore"]()}</td>
                            <td className="value">{totalScore.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </RubricTable>

                <NotesSection>
                    <label htmlFor="eval-notes">{m["evaluations.form.notesLabel"]()}</label>
                    <TextField
                        id="eval-notes"
                        multiline
                        rows={4}
                        placeholder={m["evaluations.form.notesPlaceholder"]()}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                    />
                </NotesSection>

                <Actions>
                    <SaveButton onClick={handleSubmit}>
                        {m["evaluations.form.submit"]()}
                    </SaveButton>
                    {hasExistingEvaluation && (
                        <DeleteButton onClick={handleDelete}>
                            {m["evaluations.form.delete"]()}
                        </DeleteButton>
                    )}
                    <CancelButton onClick={() => router.back()}>
                        {m["buttons.cancel"]()}
                    </CancelButton>
                </Actions>
            </InnerContainer>
        </Container>
    );
}
