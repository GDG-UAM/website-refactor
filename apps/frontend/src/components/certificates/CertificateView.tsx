"use client";

import { useEffect, useRef, useState } from "react";
import {
    ViewWrapper,
    StatusBanner,
    StatusIcon,
    StatusText,
    StatusTitle,
    StatusSubtitle,
    CertificateContainer,
    ActionsContainer,
    VerificationInfo,
    CertificateId,
    ModalSection,
    ModalSectionTitle,
    InstructionText,
    LinkContainer,
    LinkText
} from "./CertificateView.styles";
import Certificate, { CertificateData } from "./Certificate";
import { PrintButton, ShareButton, LinkedInShareButton, OpenBadgeButton, OpenLinkButton, CopyButton } from "#/components/Buttons";
import Modal from "#/components/Modal";
import * as m from "#/paraglide/messages";
import LocalTimeWithSettings from "#/components/LocalTimeWithSettings";
import { useSession } from "#/providers/SessionProvider";
import { RichText } from "../RichText";

export interface CertificateViewProps {
    data: CertificateData;
    id: string;
    isRevoked?: boolean;
    revokedAt?: Date;
    createdAt?: Date;
    showStatus?: boolean;
    showActions?: boolean;
    showVerification?: boolean;
    recipientUserId?: string;
}

export default function CertificateView({
    data,
    id,
    isRevoked = false,
    revokedAt,
    createdAt,
    showStatus,
    showActions = true,
    showVerification = false,
    recipientUserId
}: CertificateViewProps) {
    const { data: session } = useSession();

    if (showStatus === undefined) showStatus = isRevoked;

    const currentUserId = session?.user?.id;
    const showLinkedInButton = Boolean(recipientUserId && currentUserId === recipientUserId) && !isRevoked;
    const showOpenBadgeButton = Boolean(recipientUserId && currentUserId === recipientUserId) && !isRevoked;

    const certRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [wrapperHeight, setWrapperHeight] = useState<number>(0);
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    useEffect(() => {
        const resize = () => {
            if (!wrapperRef.current || !certRef.current) return;
            const containerWidth = wrapperRef.current.offsetWidth;
            const certificateWidth = certRef.current.offsetWidth;
            const certificateHeight = certRef.current.offsetHeight;
            const s = Math.min(containerWidth / certificateWidth, 1);
            setScale(s);
            setWrapperHeight(Math.ceil(certificateHeight * s));
        };

        resize();
        window.addEventListener("resize", resize);

        const ro = new ResizeObserver(resize);
        if (certRef.current) ro.observe(certRef.current);

        return () => {
            window.removeEventListener("resize", resize);
            ro.disconnect();
        };
    }, []);

    const handlePrint = () => {
        // TODO: Implement this
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: data.title,
                    text: `${m["certificates.pageTitle"]()}: ${data.title} - ${data.recipient.name}`,
                    url
                });
            } catch {}
        } else {
            await navigator.clipboard.writeText(url);
        }
    };

    const handleLinkedInShare = () => {
        let title = data.title;
        switch (data.type) {
            case "COURSE_COMPLETION":
                break;
            case "EVENT_ACHIEVEMENT":
                if (data.metadata?.rank) title = `${data.metadata.rank} - ${data.title}`;
                break;
            case "PARTICIPATION":
                switch (data.metadata?.role) {
                    case "ATTENDEE":
                        title = `${data.title} Attendee`;
                        break;
                    case "PARTICIPANT":
                        title = `${data.title} Participant`;
                        break;
                    case "SPEAKER":
                        title = `Speaker at ${data.title}`;
                        break;
                    case "ORGANIZER":
                        title = `${data.title} Organizer`;
                        break;
                }
                break;
            case "VOLUNTEER":
                const hours = data.metadata?.hours ? ` (${data.metadata.hours} hours)` : "";
                title = `${data.title} Volunteer${hours}`;
                break;
        }
        const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
            title
        )}&organizationName=GDG%20on%20Campus%20-%20Universidad%20Aut%C3%B3noma%20de%20Madrid&issueMonth=${
            (createdAt ? new Date(createdAt) : new Date()).getUTCMonth() + 1
        }&issueYear=${(createdAt ? new Date(createdAt) : new Date()).getUTCFullYear()}&expirationMonth=&expirationYear=&certUrl=${encodeURIComponent(
            `https://gdguam.es/cert/${id}`
        )}&certId=${id}`;
        window.open(linkedInUrl, "_blank", "noopener,noreferrer");
    };

    const handleOpenBadge = () => {
        setShowBadgeModal(true);
    };

    return (
        <ViewWrapper>
            {showStatus && (
                <StatusBanner $revoked={isRevoked}>
                    <StatusIcon $revoked={isRevoked}>{isRevoked ? "✕" : "✓"}</StatusIcon>
                    <StatusText>
                        <StatusTitle>{isRevoked ? m["certificates.status.revoked"]() : m["certificates.status.valid"]()}</StatusTitle>
                        <StatusSubtitle>
                            {isRevoked && revokedAt ? (
                                <RichText
                                    text={m["certificates.status.revokedOn"]()}
                                    components={{ date: <LocalTimeWithSettings iso={new Date(revokedAt).toISOString()} dateOnly fullMonth /> }}
                                />
                            ) : createdAt ? (
                                <RichText
                                    text={m["certificates.status.issuedOn"]()}
                                    components={{ date: <LocalTimeWithSettings iso={new Date(createdAt).toISOString()} dateOnly fullMonth /> }}
                                />
                            ) : null}
                        </StatusSubtitle>
                    </StatusText>
                </StatusBanner>
            )}

            <CertificateContainer>
                <div
                    ref={wrapperRef}
                    style={{
                        width: "100%",
                        height: wrapperHeight || "auto",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: "top left",
                            position: "absolute",
                            top: 0,
                            left: 0
                        }}
                    >
                        <div ref={certRef} style={{ width: "max-content" }}>
                            <Certificate data={data} />
                        </div>
                    </div>
                </div>
            </CertificateContainer>

            {showActions && (
                <ActionsContainer>
                    <PrintButton onClick={handlePrint} disabled>
                        {m["certificates.actions.print"]()}
                    </PrintButton>
                    <ShareButton onClick={handleShare}>{m["certificates.actions.share"]()}</ShareButton>
                    {showLinkedInButton && <LinkedInShareButton onClick={handleLinkedInShare}>{m["certificates.actions.addToLinkedIn"]()}</LinkedInShareButton>}
                    {showOpenBadgeButton && <OpenBadgeButton onClick={handleOpenBadge}>{m["certificates.actions.addOpenBadge"]()}</OpenBadgeButton>}
                </ActionsContainer>
            )}

            {showVerification && (
                <VerificationInfo>
                    <CertificateId>
                        {m["certificates.verification.id"]()}: {id}
                    </CertificateId>
                </VerificationInfo>
            )}

            <Modal isOpen={showBadgeModal} onClose={() => setShowBadgeModal(false)} title={m["certificates.exportModal.title"]()} width="xs">
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <ModalSection>
                        <ModalSectionTitle>{m["certificates.exportModal.manualImport"]()}</ModalSectionTitle>
                        <InstructionText>{m["certificates.exportModal.instructions"]()}</InstructionText>
                        <LinkContainer>
                            <LinkText>
                                {typeof window !== "undefined" ? window.location.origin : "https://gdguam.es"}/api/badges/assertion/{id}
                            </LinkText>
                            <CopyButton
                                content={`${typeof window !== "undefined" ? window.location.origin : "https://gdguam.es"}/api/badges/assertion/${id}`}
                                ariaLabel={m["certificates.exportModal.copyAssertion"]()}
                                iconSize={20}
                            />
                        </LinkContainer>
                    </ModalSection>

                    <hr style={{ margin: 0, border: "none", borderTop: "1px solid #e5e7eb" }} />

                    <ModalSection>
                        <ModalSectionTitle>{m["certificates.exportModal.services"]()}</ModalSectionTitle>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <OpenLinkButton color="primary" href="https://openbadgepassport.com/" fullWidth justify="flex-start">
                                {m["certificates.exportModal.openBadgePassport"]()}
                            </OpenLinkButton>
                            <OpenLinkButton color="primary" href="https://badgr.com/" fullWidth justify="flex-start">
                                {m["certificates.exportModal.badgr"]()}
                            </OpenLinkButton>
                            <OpenLinkButton color="primary" href="https://www.credly.com/" fullWidth justify="flex-start">
                                {m["certificates.exportModal.credly"]()}
                            </OpenLinkButton>
                            <OpenLinkButton color="primary" href="https://www.parchment.com/" fullWidth justify="flex-start">
                                {m["certificates.exportModal.parchment"]()}
                            </OpenLinkButton>
                        </div>
                    </ModalSection>

                    <hr style={{ margin: 0, border: "none", borderTop: "1px solid #e5e7eb" }} />

                    <OpenLinkButton
                        color="secondary"
                        href={`https://badgecheck.io/?url=${encodeURIComponent(
                            (typeof window !== "undefined" ? window.location.origin : "https://gdguam.es") + "/api/badges/assertion/" + id
                        )}`}
                        fullWidth
                        justify="flex-start"
                    >
                        {m["certificates.exportModal.validate"]()}
                    </OpenLinkButton>
                </div>
            </Modal>
        </ViewWrapper>
    );
}
