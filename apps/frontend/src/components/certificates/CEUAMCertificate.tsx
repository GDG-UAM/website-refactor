"use client";

import React from "react";
import {
    CertificateWrapper,
    BorderFrame,
    ContentLayer,
    HeaderLogos,
    MainTitle,
    SubTitle,
    AwardText,
    RecipientName,
    Footer,
    SignatureBox,
    SignatureImg,
    SignatureLine,
    SignatureName,
    SignatureRole,
    DecorationContainer,
    DateDisplay,
    Description,
    MetadataGrid,
    MetadataItem,
    DecorationClip
} from "./CEUAMCertificate.styles";
import { CertificateData } from "./types";
import * as m from "#/paraglide/messages";

// Types

export interface CEUAMCertificateProps {
    data: CertificateData;
}

// Constants

/** Google brand colors palette */
const GOOGLE_COLORS = {
    blue: "#4285F4",
    red: "#EA4335",
    yellow: "#FBBC05",
    green: "#34A853"
} as const;

/** Signature container height */
const SIGNATURE_CONTAINER_HEIGHT = 72;
const SIGNATURE_PLACEHOLDER_HEIGHT = 50;

// Helper Functions

/**
 * Formats a date string to a human-readable format
 * @param dateStr - ISO date string
 * @returns Formatted date string (e.g., "January 14, 2026")
 */
const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    } catch {
        return dateStr;
    }
};

// Sub-components

const Decoration: React.FC = () => (
    <DecorationClip aria-hidden>
        <DecorationContainer>
            {/* Top-Left Corner */}
            <div className="corner corner-tl">
                <svg width="420" height="420" viewBox="0 0 420 420">
                    <defs>
                        <linearGradient id="google4-tl" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={GOOGLE_COLORS.blue} />
                            <stop offset="33%" stopColor={GOOGLE_COLORS.red} />
                            <stop offset="66%" stopColor={GOOGLE_COLORS.yellow} />
                            <stop offset="100%" stopColor={GOOGLE_COLORS.green} />
                        </linearGradient>
                    </defs>

                    {/* CEUAM wire triangles */}
                    <polygon points="16,250 250,16 390,390" fill="none" stroke="var(--ceuam)" strokeWidth="2" opacity="0.14" />
                    <polygon points="60,265 265,60 390,360" fill="none" stroke="var(--ceuam)" strokeWidth="1.5" opacity="0.10" strokeDasharray="7 10" />

                    {/* Google gradient strokes */}
                    <circle cx="140" cy="120" r="84" fill="none" stroke="url(#google4-tl)" strokeWidth="2.3" opacity="0.22" />
                    <circle cx="200" cy="150" r="58" fill="none" stroke="url(#google4-tl)" strokeWidth="2.3" opacity="0.20" strokeDasharray="5 9" />
                    <path d="M38 128 A110 110 0 0 1 160 36" fill="none" stroke="url(#google4-tl)" strokeWidth="2.3" opacity="0.20" />
                    <path d="M86 300 A150 150 0 0 1 300 86" fill="none" stroke="url(#google4-tl)" strokeWidth="2.3" opacity="0.20" strokeDasharray="7 11" />
                    <polygon points="300,56 332,74 332,110 300,128 268,110 268,74" fill="none" stroke="url(#google4-tl)" strokeWidth="2.3" opacity="0.18" />
                </svg>
            </div>

            {/* Top-Right Corner */}
            <div className="corner corner-tr">
                <svg width="360" height="360" viewBox="0 0 360 360">
                    <defs>
                        <linearGradient id="google4-tr" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={GOOGLE_COLORS.blue} />
                            <stop offset="33%" stopColor={GOOGLE_COLORS.red} />
                            <stop offset="66%" stopColor={GOOGLE_COLORS.yellow} />
                            <stop offset="100%" stopColor={GOOGLE_COLORS.green} />
                        </linearGradient>
                    </defs>

                    {/* CEUAM wire frame */}
                    <polygon points="40,20 340,80 280,340" fill="none" stroke="var(--ceuam)" strokeWidth="2" opacity="0.10" />
                    <polygon points="70,50 330,100 270,330" fill="none" stroke="var(--ceuam)" strokeWidth="1.5" opacity="0.08" strokeDasharray="6 10" />

                    {/* Google gradient strokes */}
                    <circle cx="250" cy="110" r="62" fill="none" stroke="url(#google4-tr)" strokeWidth="2.3" opacity="0.20" />
                    <circle cx="250" cy="110" r="42" fill="none" stroke="url(#google4-tr)" strokeWidth="2.3" opacity="0.18" strokeDasharray="4 8" />
                    <path d="M320 40 L120 240" fill="none" stroke="url(#google4-tr)" strokeWidth="2.3" opacity="0.18" strokeDasharray="7 12" />
                    <path d="M305 145 A70 70 0 0 1 235 215" fill="none" stroke="url(#google4-tr)" strokeWidth="2.3" opacity="0.18" />
                </svg>
            </div>

            {/* Bottom-Left Corner */}
            <div className="corner corner-bl">
                <svg width="380" height="380" viewBox="0 0 380 380">
                    <defs>
                        <linearGradient id="google4-bl" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={GOOGLE_COLORS.blue} />
                            <stop offset="33%" stopColor={GOOGLE_COLORS.red} />
                            <stop offset="66%" stopColor={GOOGLE_COLORS.yellow} />
                            <stop offset="100%" stopColor={GOOGLE_COLORS.green} />
                        </linearGradient>
                    </defs>

                    {/* CEUAM wire triangles */}
                    <polygon points="20,320 160,60 360,360" fill="none" stroke="var(--ceuam)" strokeWidth="2" opacity="0.10" />
                    <polygon points="55,320 175,90 360,335" fill="none" stroke="var(--ceuam)" strokeWidth="1.5" opacity="0.08" strokeDasharray="7 11" />

                    {/* Google gradient strokes */}
                    <circle cx="110" cy="260" r="70" fill="none" stroke="url(#google4-bl)" strokeWidth="2.3" opacity="0.20" />
                    <path d="M40 270 A95 95 0 0 0 170 350" fill="none" stroke="url(#google4-bl)" strokeWidth="2.3" opacity="0.18" strokeDasharray="6 10" />
                    <polygon points="210,250 315,175 340,320" fill="none" stroke="url(#google4-bl)" strokeWidth="2.3" opacity="0.16" />
                </svg>
            </div>

            {/* Bottom-Right Corner */}
            <div className="corner corner-br">
                <svg width="440" height="440" viewBox="0 0 440 440">
                    <defs>
                        <linearGradient id="google4-br" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={GOOGLE_COLORS.blue} />
                            <stop offset="33%" stopColor={GOOGLE_COLORS.red} />
                            <stop offset="66%" stopColor={GOOGLE_COLORS.yellow} />
                            <stop offset="100%" stopColor={GOOGLE_COLORS.green} />
                        </linearGradient>
                    </defs>

                    {/* CEUAM wire triangles */}
                    <polygon points="70,70 420,190 200,420" fill="none" stroke="var(--ceuam)" strokeWidth="2" opacity="0.13" />
                    <polygon points="105,100 405,200 220,405" fill="none" stroke="var(--ceuam)" strokeWidth="1.5" opacity="0.10" strokeDasharray="7 10" />

                    {/* Google gradient strokes */}
                    <circle cx="300" cy="300" r="86" fill="none" stroke="url(#google4-br)" strokeWidth="2.3" opacity="0.20" />
                    <circle cx="340" cy="285" r="58" fill="none" stroke="url(#google4-br)" strokeWidth="2.3" opacity="0.18" strokeDasharray="5 10" />
                    <path d="M420 310 A150 150 0 0 1 285 420" fill="none" stroke="url(#google4-br)" strokeWidth="2.3" opacity="0.20" />
                    <path d="M360 140 A180 180 0 0 1 140 360" fill="none" stroke="url(#google4-br)" strokeWidth="2.3" opacity="0.18" strokeDasharray="7 12" />
                </svg>
            </div>
        </DecorationContainer>
    </DecorationClip>
);

/**
 * CEUAM Certificate Design
 * A certificate template featuring CEUAM (Consejo de Estudiantes UAM) branding
 * with Google-colored decorative elements.
 */
export default function CEUAMCertificate({ data }: CEUAMCertificateProps) {
    /**
     * Generates metadata items based on certificate type
     */
    const getMetadataItems = (): { label: string; value: React.ReactNode }[] => {
        const items: { label: string; value: React.ReactNode }[] = [];

        if (data.type === "COURSE_COMPLETION" && data.metadata) {
            if (data.metadata.hours) {
                items.push({
                    label: m["admin.certificates.form.hours"](),
                    value: `${data.metadata.hours} Hours`
                });
            }
            if (data.metadata.grade) {
                items.push({
                    label: m["admin.certificates.form.grade"](),
                    value: data.metadata.grade
                });
            }
            if (data.metadata.instructors?.length) {
                const names = data.metadata.instructors
                    .map((instructor) => instructor.name)
                    .filter(Boolean)
                    .join(", ");
                if (names) {
                    items.push({
                        label: m["admin.certificates.form.instructors"](),
                        value: names
                    });
                }
            }
        }

        if (data.type === "EVENT_ACHIEVEMENT" && data.metadata) {
            if (data.metadata.rank) {
                items.push({
                    label: m["admin.certificates.form.rank"](),
                    value: data.metadata.rank
                });
            }
            if (data.metadata.group) {
                items.push({
                    label: m["admin.certificates.form.group"](),
                    value: data.metadata.group
                });
            }
        }

        if (data.type === "PARTICIPATION" && data.metadata?.role) {
            const roleLabelKey = `admin.certificates.form.roles.${data.metadata.role}` as keyof typeof m;
            const roleLabel = typeof m[roleLabelKey] === "function" ? (m[roleLabelKey] as () => string)() : data.metadata.role;

            items.push({
                label: m["admin.certificates.form.role"](),
                value: roleLabel
            });
        }

        if (data.type === "VOLUNTEER" && data.metadata?.hours) {
            items.push({
                label: m["admin.certificates.form.hours"](),
                value: `${data.metadata.hours}`
            });
        }

        return items;
    };

    // Computed values
    const metaItems = getMetadataItems();

    const mainTitleKey = `admin.certificates.types.${data.type}` as keyof typeof m;
    const mainTitle = typeof m[mainTitleKey] === "function" ? (m[mainTitleKey] as () => string)() : "Certificate of Achievement";

    const dateString = data.period?.startDate
        ? data.period.endDate
            ? `${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)}`
            : formatDate(data.period.startDate)
        : formatDate(new Date().toISOString());

    return (
        <CertificateWrapper>
            <BorderFrame />
            <Decoration />

            <ContentLayer>
                {/* Header with logos */}
                <HeaderLogos>
                    <img src="/logo/logo.svg" alt="GDG UAM" />
                    <div className="divider" />
                    <img src="https://ceuam.es/archivo/Consejo-de-Estudiantes-CEUAM.png" alt="CEUAM" />
                </HeaderLogos>

                {/* Title section */}
                <MainTitle>{mainTitle}</MainTitle>
                <SubTitle>{data.title}</SubTitle>
                <DateDisplay>{dateString}</DateDisplay>

                {/* Recipient section */}
                <AwardText>This is awarded to</AwardText>
                <RecipientName>{data.recipient.name}</RecipientName>

                {/* Optional description */}
                {data.description && <Description>{data.description}</Description>}

                {/* Metadata grid */}
                {metaItems.length > 0 && (
                    <MetadataGrid>
                        {metaItems.map((item, index) => (
                            <MetadataItem key={index}>
                                <span className="label">{item.label}:</span>
                                <span className="value">{item.value}</span>
                            </MetadataItem>
                        ))}
                    </MetadataGrid>
                )}

                {/* Signatures footer */}
                <Footer>
                    {data.signatures?.slice(0, 2).map((signature, index) => (
                        <SignatureBox key={index}>
                            <div
                                style={{
                                    height: SIGNATURE_CONTAINER_HEIGHT,
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "center"
                                }}
                            >
                                {signature.imageUrl ? (
                                    <SignatureImg src={signature.imageUrl} alt={signature.name} />
                                ) : (
                                    <div style={{ height: SIGNATURE_PLACEHOLDER_HEIGHT }} />
                                )}
                            </div>
                            <SignatureLine />
                            <SignatureName>{signature.name}</SignatureName>
                            <SignatureRole>{signature.role}</SignatureRole>
                        </SignatureBox>
                    ))}
                </Footer>
            </ContentLayer>
        </CertificateWrapper>
    );
}
