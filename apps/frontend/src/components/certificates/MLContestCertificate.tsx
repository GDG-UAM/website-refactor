"use client";

import localFont from "next/font/local";
import { useId } from "react";
import * as S from "./MLContestCertificate.styles";
import { buildHeatmap } from "./mlContestHeatmap";
import { CertificateData } from "./types";

const display = localFont({ src: "../../fonts/space-grotesk-400-700.woff2", weight: "400 700", variable: "--ml-font-display" });
const mono = localFont({ src: "../../fonts/jetbrains-mono-400-600.woff2", weight: "400 600", variable: "--ml-font-mono" });

const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];
const CELL = 11;
const CONTEST = "the 1st Machine Learning Contest of GDG on Campus UAM";

// The frame (961 × 712, 24px in from the edges), with a 1.5px border. Its grid: 28px squares centred in the frame's
// inside (the first lines 17px from the left and 18.5px from the top, as much room after the last ones), fading in from
// the left. Its ruler: a tick on each vertical line along the top and bottom, 2.5px wide, flat where it starts in the
// border and round 7px in.
const FRAME_W = 961;
const FRAME_H = 712;
const GRID_XS = Array.from({ length: 34 }, (_, i) => 18.5 + 28 * i);
const GRID_YS = Array.from({ length: 25 }, (_, i) => 20 + 28 * i);
const GRID_PATH = GRID_XS.map((x) => `M${x} 1.5V${FRAME_H - 1.5}`).join("") + GRID_YS.map((y) => `M1.5 ${y}H${FRAME_W - 1.5}`).join("");
const RULER_PATH = GRID_XS.map(
    (x) =>
        `M${x - 1.25} .75V7.25A1.25 1.25 0 0 0 ${x + 1.25} 7.25V.75Z` +
        `M${x - 1.25} ${FRAME_H - 0.75}V${FRAME_H - 7.25}A1.25 1.25 0 0 1 ${x + 1.25} ${FRAME_H - 7.25}V${FRAME_H - 0.75}Z`
).join("");

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
    const gridId = `ml-grid-${useId().replace(/:/g, "")}`; // one per certificate on the page
    const height = map.rows * CELL;

    return (
        <S.CertificateWrapper className={`${display.variable} ${mono.variable}`}>
            <S.Frame width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} aria-hidden>
                <linearGradient id={gridId} gradientUnits="userSpaceOnUse" x1="1.5" x2={FRAME_W - 1.5}>
                    <stop offset=".52" stopColor="#e9eef7" stopOpacity=".3" />
                    <stop offset=".72" stopColor="#e9eef7" />
                </linearGradient>
                <path d={GRID_PATH} stroke={`url(#${gridId})`} fill="none" />
                <rect x=".75" y=".75" width={FRAME_W - 1.5} height={FRAME_H - 1.5} fill="none" stroke="#14203b" strokeWidth={1.5} />
                <path d={RULER_PATH} fill="#14203b" />
            </S.Frame>

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
