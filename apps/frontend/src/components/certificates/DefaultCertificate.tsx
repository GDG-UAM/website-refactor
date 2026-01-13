"use client";

import React from "react";
import {
    CertificateWrapper,
    CertificateCard,
    Watermark,
    ContentLayer,
    HeaderLogo,
    Title,
    Subtitle,
    DateDisplay,
    PresentationText,
    RecipientName,
    Description,
    MetadataGrid,
    MetadataItem,
    Footer,
    SignaturesSection,
    SignatureBlock,
    SignatureImage,
    SignatureLine,
    SignatureText,
    SignatureRole
} from "./DefaultCertificate.styles";
import { CertificateData } from "./types";
import * as m from "#/paraglide/messages";

export interface DefaultCertificateProps {
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

export default function DefaultCertificate({ data }: DefaultCertificateProps) {
    // Prepare metadata items for the grid
    const getMetadataItems = () => {
        const items: { label: string; value: React.ReactNode }[] = [];

        if (data.type === "COURSE_COMPLETION" && data.metadata) {
            if (data.metadata.hours) items.push({ label: m["admin.certificates.form.hours"](), value: `${data.metadata.hours} Hours` });
            if (data.metadata.grade) items.push({ label: m["admin.certificates.form.grade"](), value: data.metadata.grade });
            // Instructors
            if (data.metadata.instructors?.length) {
                const names = data.metadata.instructors
                    .map((i) => i.name)
                    .filter(Boolean)
                    .join(", ");
                if (names) items.push({ label: m["admin.certificates.form.instructors"](), value: names });
            }
        }

        if (data.type === "EVENT_ACHIEVEMENT" && data.metadata) {
            if (data.metadata.rank) items.push({ label: m["admin.certificates.form.rank"](), value: data.metadata.rank });
            if (data.metadata.group) items.push({ label: m["admin.certificates.form.group"](), value: data.metadata.group });
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
            items.push({ label: m["admin.certificates.form.hours"](), value: `${data.metadata.hours}` });
        }

        return items;
    };

    const metaItems = getMetadataItems();

    // Determine main title
    const mainTitleKey = `admin.certificates.types.${data.type}` as keyof typeof m;
    const mainTitle = typeof m[mainTitleKey] === "function" ? (m[mainTitleKey] as any)() : "Certificate";
    const subTitle = data.title; // The specific event/course name

    const dateString = data.period?.startDate
        ? data.period.endDate
            ? `${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)}`
            : formatDate(data.period.startDate)
        : formatDate(new Date().toISOString());

    return (
        <CertificateWrapper>
            <CertificateCard>
                <Watermark />

                <ContentLayer>
                    {/* Association Logo */}
                    <HeaderLogo src="/logo/logo.svg" alt="Organization Logo" />

                    <Title>{mainTitle}</Title>
                    <Subtitle>{subTitle}</Subtitle>

                    {/* Moved Date Display */}
                    <DateDisplay>{dateString}</DateDisplay>

                    <PresentationText>This certificate is proudly presented to</PresentationText>

                    <RecipientName>{data.recipient.name}</RecipientName>

                    {data.description && <Description>{data.description}</Description>}

                    {metaItems.length > 0 && (
                        <MetadataGrid>
                            {metaItems.map((item, idx) => (
                                <MetadataItem key={idx}>
                                    <span className="label">{item.label}</span>
                                    <span className="value">{item.value}</span>
                                </MetadataItem>
                            ))}
                        </MetadataGrid>
                    )}

                    <Footer>
                        {data.signatures && (
                            <SignaturesSection>
                                {data.signatures.map((sig, i) => (
                                    <SignatureBlock key={i}>
                                        {sig.imageUrl ? (
                                            <SignatureImage src={sig.imageUrl} alt={sig.name} />
                                        ) : (
                                            <div style={{ height: "60px", marginBottom: "-15px" }}></div>
                                        )}
                                        <SignatureLine />
                                        <SignatureText>{sig.name}</SignatureText>
                                        <SignatureRole>{sig.role}</SignatureRole>
                                    </SignatureBlock>
                                ))}
                            </SignaturesSection>
                        )}
                    </Footer>
                </ContentLayer>
            </CertificateCard>
        </CertificateWrapper>
    );
}
