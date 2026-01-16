"use client";

import { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "#/providers/SessionProvider";
import { authClient } from "#/lib/auth-client";
import { CancelButton } from "./Buttons";
import { Avatar } from "@mui/material";
import { newSuccessToast, newErrorToast } from "./Toast";
import * as m from "#/paraglide/messages";

const PillContainer = styled(motion.div)`
    position: fixed;
    bottom: 2rem;
    left: 2rem;
    z-index: 9999;
    background: #ffffff;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
    padding: 0.35rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    color: #0f172a;
    cursor: default;
    overflow: hidden;
    max-width: 200px;
`;

const Content = styled(motion.div)`
    display: flex;
    flex-direction: column;
    padding-right: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
`;

const Label = styled.span`
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    font-weight: 700;
`;

const UserName = styled.span`
    font-size: 0.85rem;
    font-weight: 600;
    color: #0f172a;
`;

const AvatarWrapper = styled.div`
    position: relative;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
`;

const StopOverlay = styled(motion.div)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;

    & > button {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        padding: 0;
        min-width: 0;
    }
`;

export function ImpersonationPill() {
    const { data: session } = useSession();
    const [hovered, setHovered] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const impersonator = session?.session.impersonatedBy;
    const isImpersonating = !!impersonator;
    const impersonatedUser = session?.user;

    if (!isImpersonating || !impersonatedUser) return null;

    const handleStop = async () => {
        setSubmitting(true);
        try {
            const { error } = await authClient.admin.stopImpersonating();
            if (!error) {
                newSuccessToast("Stopped impersonation");
                window.location.href = "/admin/users";
            } else {
                newErrorToast("Failed to stop impersonation");
            }
        } catch (e) {
            console.error("Stop impersonation failed:", e);
            newErrorToast("Failed to stop impersonation");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <PillContainer
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <AvatarWrapper>
                    <Avatar src={impersonatedUser.image || undefined} sx={{ width: 36, height: 36, border: "1px solid rgba(0,0,0,0.05)" }}>
                        {impersonatedUser.name?.charAt(0)}
                    </Avatar>
                    <AnimatePresence>
                        {hovered && (
                            <StopOverlay initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                <CancelButton onClick={handleStop} isLoading={submitting} iconSize={18} color="danger" />
                            </StopOverlay>
                        )}
                    </AnimatePresence>
                </AvatarWrapper>
                <Content>
                    <Label>{m["admin.users.impersonating"]()}</Label>
                    <UserName>{impersonatedUser.name}</UserName>
                </Content>
            </PillContainer>
        </AnimatePresence>
    );
}
