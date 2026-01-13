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

export interface CEUAMCertificateProps {
    data: CertificateData;
}

const formatDate = (dateStr?: string) => {
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

const Decoration = () => (
    <DecorationClip>
        <DecorationContainer>
            {/* Top Left */}
            <div className="shapes top-left">
                <svg width="300" height="300" viewBox="0 0 200 200">
                    <polygon points="10,120 120,10 180,180" fill="#f0a500" opacity="0.3" />
                    <polygon points="80,20 190,90 130,140" fill="#f0a500" opacity="0.15" />
                    <polygon points="0,0 60,10 10,80" fill="#f0a500" opacity="0.2" />
                </svg>
            </div>

            <div className="dots dots-tl">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="dot" />
                ))}
            </div>

            {/* Bottom Right */}
            <div className="shapes bottom-right">
                <svg width="300" height="300" viewBox="0 0 200 200">
                    <polygon points="10,120 120,10 180,180" fill="#f0a500" opacity="0.4" />
                    <polygon points="80,20 180,100 120,130" fill="#f0a500" opacity="0.2" />
                    <polygon points="150,150 200,160 160,200" fill="#f0a500" opacity="0.25" />
                </svg>
            </div>

            <div className="dots dots-br">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="dot" />
                ))}
            </div>
        </DecorationContainer>
    </DecorationClip>
);

export default function CEUAMCertificate({ data }: CEUAMCertificateProps) {
    const getMetadataItems = () => {
        const items: { label: string; value: React.ReactNode }[] = [];

        if (data.type === "COURSE_COMPLETION" && data.metadata) {
            if (data.metadata.hours)
                items.push({
                    label: m["admin.certificates.form.hours"](),
                    value: `${data.metadata.hours} Hours`
                });
            if (data.metadata.grade)
                items.push({
                    label: m["admin.certificates.form.grade"](),
                    value: data.metadata.grade
                });
            if (data.metadata.instructors?.length) {
                const names = data.metadata.instructors
                    .map((i: any) => i.name)
                    .filter(Boolean)
                    .join(", ");
                if (names)
                    items.push({
                        label: m["admin.certificates.form.instructors"](),
                        value: names
                    });
            }
        }

        if (data.type === "EVENT_ACHIEVEMENT" && data.metadata) {
            if (data.metadata.rank)
                items.push({
                    label: m["admin.certificates.form.rank"](),
                    value: data.metadata.rank
                });
            if (data.metadata.group)
                items.push({
                    label: m["admin.certificates.form.group"](),
                    value: data.metadata.group
                });
        }

        if (data.type === "PARTICIPATION" && data.metadata?.role) {
            const roleLabelKey = `admin.certificates.form.roles.${data.metadata.role}` as keyof typeof m;
            const roleLabel = typeof m[roleLabelKey] === "function" ? (m[roleLabelKey] as any)() : data.metadata.role;
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

    const metaItems = getMetadataItems();

    const mainTitleKey = `admin.certificates.types.${data.type}` as keyof typeof m;
    const mainTitle = typeof m[mainTitleKey] === "function" ? (m[mainTitleKey] as any)() : "Certificate of Achievement";

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
                <HeaderLogos>
                    <img src="/logo/logo.svg" alt="GDG UAM" />
                    <div className="divider" />
                    <img src="https://ceuam.es/archivo/Consejo-de-Estudiantes-CEUAM.png" alt="CEUAM" />
                </HeaderLogos>

                <MainTitle>{mainTitle}</MainTitle>
                <SubTitle>{data.title}</SubTitle>
                <DateDisplay>{dateString}</DateDisplay>

                <AwardText>This is awarded to</AwardText>
                <RecipientName>{data.recipient.name}</RecipientName>

                {data.description && <Description>{data.description}</Description>}

                {metaItems.length > 0 && (
                    <MetadataGrid>
                        {metaItems.map((item, i) => (
                            <MetadataItem key={i}>
                                <span className="label">{item.label}:</span>
                                <span className="value">{item.value}</span>
                            </MetadataItem>
                        ))}
                    </MetadataGrid>
                )}

                <Footer>
                    {data.signatures?.slice(0, 2).map((sig, i) => (
                        <SignatureBox key={i}>
                            <div style={{ height: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                                {sig.imageUrl ? <SignatureImg src={sig.imageUrl} alt={sig.name} /> : <div style={{ height: 40 }}></div>}
                            </div>
                            <SignatureLine />
                            <SignatureName>{sig.name}</SignatureName>
                            <SignatureRole>{sig.role}</SignatureRole>
                        </SignatureBox>
                    ))}
                </Footer>
            </ContentLayer>
        </CertificateWrapper>
    );
}
