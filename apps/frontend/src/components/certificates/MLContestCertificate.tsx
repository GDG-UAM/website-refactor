"use client";

import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import * as S from "./MLContestCertificate.styles";
import { buildHeatmap } from "./mlContestHeatmap";
import { CertificateData } from "./types";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--ml-font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--ml-font-mono", display: "swap" });

const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];
const CELL = 11;
const CONTEST = "the 1st Machine Learning Contest of GDG on Campus UAM";

const formatPeriod = (period?: CertificateData["period"]): string => {
    try {
        const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
        const start = period?.startDate ? new Date(period.startDate) : new Date();
        const end = period?.endDate ? new Date(period.endDate) : undefined;
        return end && end > start ? fmt.formatRange(start, end) : fmt.format(start);
    } catch {
        return "";
    }
};

export interface MLContestCertificateProps {
    data: CertificateData;
}

/**
 * GDG on Campus UAM ML Contest 2026 certificate (participation and achievement).
 * Team name comes from metadata.group and placement from metadata.rank.
 */
export default function MLContestCertificate({ data }: MLContestCertificateProps) {
    const achievement = data.type === "EVENT_ACHIEVEMENT";
    const team = data.metadata?.group;
    const placement = achievement ? data.metadata?.rank : undefined;
    const name = data.recipient.name;
    const nameSize = 50 * (name.length <= 18 ? 1 : name.length <= 26 ? 0.84 : 0.7);

    // Written as a continuation, e.g. "with the fastest model in the competition: …"
    const ending = data.description?.trim();

    const map = buildHeatmap(team || name);
    const width = map.cols * CELL;
    const height = map.rows * CELL;

    return (
        <S.CertificateWrapper className={`${display.variable} ${mono.variable}`}>
            <S.GridPaper />
            <S.Frame />

            <S.Top>
                <S.Lockup>
                    <img src="/logo/logo.svg" alt="GDG UAM" />
                    <div>
                        <b>GDG on Campus</b>
                        <span>Universidad Autónoma de Madrid</span>
                    </div>
                </S.Lockup>
                <S.Meta>
                    <span>{data.title}</span>
                    <span>{formatPeriod(data.period)}</span>
                </S.Meta>
            </S.Top>

            <S.Body>
                <S.Eyebrow>{achievement ? "Certificate of Achievement" : "Certificate of Participation"}</S.Eyebrow>
                <S.Lead>This certifies that</S.Lead>
                <S.RecipientName style={{ fontSize: nameSize }}>{name}</S.RecipientName>
                {/* One sentence: team, placement and contest from the template; the description finishes it */}
                <S.Statement>
                    {team && (
                        <>
                            of team <code>{team}</code>{" "}
                        </>
                    )}
                    {placement ? (
                        <>
                            achieved <code>{placement}</code> in
                        </>
                    ) : (
                        "competed in"
                    )}{" "}
                    {CONTEST}
                    {ending ? ` ${ending}` : "."}
                </S.Statement>
            </S.Body>

            <S.Heatmap style={{ width }}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
                    {map.cells.map((c) => (
                        <rect
                            key={`${c.x},${c.y}`}
                            x={c.x * CELL + 1}
                            y={c.y * CELL + 1}
                            width={CELL - 2}
                            height={CELL - 2}
                            rx={1.5}
                            fill={GOOGLE_COLORS[c.c]}
                            fillOpacity={+(0.35 + 0.65 * c.v).toFixed(2)}
                        />
                    ))}
                </svg>
                <S.Caption>
                    Fig. 1 · Seeded from the {team ? "team name" : "recipient"} (0x{map.seed.toString(16).padStart(8, "0")}).
                </S.Caption>
            </S.Heatmap>

            <S.Signatures>
                {data.signatures?.map((sig, i) => (
                    <S.Signature key={i}>
                        <S.SignatureImage>{sig.imageUrl && <img src={sig.imageUrl} alt={sig.name} />}</S.SignatureImage>
                        <S.SignatureLine />
                        <S.SignatureName>{sig.name}</S.SignatureName>
                        <S.SignatureRole>{sig.role}</S.SignatureRole>
                    </S.Signature>
                ))}
            </S.Signatures>
        </S.CertificateWrapper>
    );
}
