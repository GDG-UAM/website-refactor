"use client";

import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import { SendButton, PlainButton } from "#/components/Buttons";
import * as m from "#/paraglide/messages";
import { api } from "#/lib/eden";
import { Right, FormTitle, Toggle, StyledForm } from "./ContactForm.styles";

const iconPaths = {
    user: "M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z",
    email: "M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480v58q0 59-40.5 100.5T740-280q-35 0-66-15t-52-43q-29 29-65.5 43.5T480-280q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480v58q0 26 17 44t43 18q26 0 43-18t17-44v-58q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93h200v80H480Zm0-280q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Z",
    organization:
        "M80-120v-720h400v160h400v560H80Zm80-80h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 480h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 480h320v-400H480v80h80v80h-80v80h80v80h-80v80Zm160-240v-80h80v80h-80Zm0 160v-80h80v80h-80Z",
    // website:
    // "M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-7-.5-14.5T799-507q-5 29-27 48t-52 19h-80q-33 0-56.5-23.5T560-520v-40H400v-80q0-33 23.5-56.5T480-720h40q0-23 12.5-40.5T563-789q-20-5-40.5-8t-42.5-3q-134 0-227 93t-93 227h200q66 0 113 47t47 113v40H400v110q20 5 39.5 7.5T480-160Z"
    website:
        "M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Zm0-82q26-36 45-75t31-83H404q12 44 31 83t45 75Zm-104-16q-18-33-31.5-68.5T322-320H204q29 50 72.5 87t99.5 55Zm208 0q56-18 99.5-55t72.5-87H638q-9 38-22.5 73.5T584-178ZM170-400h136q-3-20-4.5-39.5T300-480q0-21 1.5-40.5T306-560H170q-5 20-7.5 39.5T160-480q0 21 2.5 40.5T170-400Zm216 0h188q3-20 4.5-39.5T580-480q0-21-1.5-40.5T574-560H386q-3 20-4.5 39.5T380-480q0 21 1.5 40.5T386-400Zm268 0h136q5-20 7.5-39.5T800-480q0-21-2.5-40.5T790-560H654q3 20 4.5 39.5T660-480q0 21-1.5 40.5T654-400Zm-16-240h118q-29-50-72.5-87T584-782q18 33 31.5 68.5T638-640Zm-234 0h152q-12-44-31-83t-45-75q-26 36-45 75t-31 83Zm-200 0h118q9-38 22.5-73.5T376-782q-56 18-99.5 55T204-640Z"
};

const Icon: React.FC<{ icon: keyof typeof iconPaths }> = ({ icon }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="var(--google-dark-gray)"
        style={{ marginRight: 8, flexShrink: 0 }}
    >
        <path d={iconPaths[icon]} />
    </svg>
);

type Mode = "personal" | "sponsor";

type ContactPayload = {
    type: Mode;
    name: string;
    email: string;
    message: string;
    orgName?: string;
    website?: string;
};

function isValidEmail(email: string) {
    return /^[\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

interface ContactFormProps {
    gridRef?: React.RefObject<HTMLDivElement>;
    rightRef?: React.RefObject<HTMLDivElement>;
}

export default function ContactForm({ gridRef, rightRef }: ContactFormProps) {
    const [mode, setMode] = useState<Mode>("personal");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [touchedName, setTouchedName] = useState(false);
    const [touchedEmail, setTouchedEmail] = useState(false);
    const [touchedMessage, setTouchedMessage] = useState(false);

    const [orgName, setOrgName] = useState("");
    const [website, setWebsite] = useState("");
    const [touchedOrgName, setTouchedOrgName] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    // Update grid min-height based on right section height
    useEffect(() => {
        const updateMinHeight = () => {
            if (gridRef && gridRef.current && rightRef && rightRef.current) {
                const isDesktop = window.innerWidth > 768;
                if (isDesktop) {
                    const rightHeight = rightRef.current.offsetHeight;
                    gridRef.current.style.minHeight = `${rightHeight}px`;
                } else {
                    gridRef.current.style.minHeight = "";
                }
            }
        };

        updateMinHeight();

        // Use ResizeObserver to track changes in right section height
        const resizeObserver = new ResizeObserver(updateMinHeight);
        if (rightRef && rightRef.current) {
            resizeObserver.observe(rightRef.current);
        }

        // Track window resize
        window.addEventListener("resize", updateMinHeight);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateMinHeight);
        };
    }, [mode]); // Re-run when mode changes (affects form height)

    const handleSubmit = async () => {
        setSubmitting(true);

        const payload: ContactPayload = { type: mode, name, email, message };
        if (mode === "sponsor") {
            payload.orgName = orgName;
            payload.website = website;
        }

        try {
            const { error } = await api.contact.post(payload);
            if (!error) {
                setName("");
                setTouchedName(false);
                setEmail("");
                setTouchedEmail(false);
                setOrgName("");
                setTouchedOrgName(false);
                setWebsite("");
                setMessage("");
                setTouchedMessage(false);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const invalidName = !name.trim();
    const invalidEmail = !email.trim() || !isValidEmail(email);
    const invalidMessage = !message.trim();
    const invalidOrgName = !orgName.trim();

    const fieldsMissing = mode === "personal" ? invalidName || invalidEmail || invalidMessage : invalidOrgName || invalidName || invalidEmail || invalidMessage;

    const personalInvalid = {
        name: invalidName,
        email: invalidEmail,
        message: invalidMessage
    };

    const sendTooltip = fieldsMissing ? "Some required fields are missing or invalid" : undefined;

    return (
        <Right>
            <Toggle>
                <PlainButton
                    noBackground
                    slim
                    style={{ fontSize: "0.95rem" }}
                    color={mode === "personal" ? "primary" : "default"}
                    onClick={() => setMode("personal")}
                >
                    {m["contact.personal"]()}
                </PlainButton>
                <PlainButton
                    noBackground
                    slim
                    style={{ fontSize: "0.95rem" }}
                    color={mode === "sponsor" ? "primary" : "default"}
                    onClick={() => setMode("sponsor")}
                >
                    {m["contact.sponsor"]()}
                </PlainButton>
            </Toggle>

            <FormTitle>{mode === "personal" ? m["contact.formTitlePersonal"]() : m["contact.formTitleSponsor"]()}</FormTitle>
            <StyledForm onSubmit={handleSubmit}>
                {mode === "personal" ? (
                    <>
                        <div style={{ display: "flex", gap: 8 }}>
                            <TextField
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => setTouchedName(true)}
                                label={m["contact.fullName"]()}
                                fullWidth
                                required
                                error={touchedName && personalInvalid.name}
                                helperText={touchedName && personalInvalid.name ? m["contact.required"]() : " "}
                                placeholder={m["contact.namePlaceholder"]()}
                                slotProps={{
                                    input: {
                                        startAdornment: <Icon icon="user" />
                                    }
                                }}
                            />
                        </div>

                        <TextField
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => setTouchedEmail(true)}
                            label={m["contact.email"]()}
                            type="email"
                            fullWidth
                            required
                            error={touchedEmail && personalInvalid.email}
                            helperText={
                                touchedEmail && personalInvalid.email ? (email.trim() === "" ? m["contact.required"]() : m["contact.validEmail"]()) : " "
                            }
                            placeholder={m["contact.emailPlaceholder"]()}
                            slotProps={{
                                input: {
                                    startAdornment: <Icon icon="email" />
                                }
                            }}
                        />

                        <TextField
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onBlur={() => setTouchedMessage(true)}
                            label={m["contact.message"]()}
                            multiline
                            rows={6}
                            fullWidth
                            required
                            error={touchedMessage && personalInvalid.message}
                            helperText={touchedMessage && personalInvalid.message ? m["contact.required"]() : " "}
                        />
                    </>
                ) : (
                    <>
                        <TextField
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            onBlur={() => setTouchedOrgName(true)}
                            label={m["contact.organization"]()}
                            fullWidth
                            required
                            error={touchedOrgName && invalidOrgName}
                            helperText={touchedOrgName && invalidOrgName ? m["contact.required"]() : " "}
                            placeholder={m["contact.organizationPlaceholder"]()}
                            slotProps={{
                                input: {
                                    startAdornment: <Icon icon="organization" />
                                }
                            }}
                        />
                        <TextField
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={() => setTouchedName(true)}
                            label={m["contact.fullName"]()}
                            fullWidth
                            required
                            error={touchedName && invalidName}
                            helperText={touchedName && invalidName ? m["contact.required"]() : " "}
                            placeholder={m["contact.namePlaceholder"]()}
                            slotProps={{
                                input: {
                                    startAdornment: <Icon icon="user" />
                                }
                            }}
                        />
                        <TextField
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => setTouchedEmail(true)}
                            label={m["contact.email"]()}
                            type="email"
                            fullWidth
                            required
                            error={touchedEmail && invalidEmail}
                            helperText={touchedEmail && invalidEmail ? (email.trim() === "" ? m["contact.required"]() : m["contact.validEmail"]()) : " "}
                            placeholder={m["contact.emailPlaceholder"]()}
                            slotProps={{
                                input: {
                                    startAdornment: <Icon icon="email" />
                                }
                            }}
                        />
                        <TextField
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            label={m["contact.website"]()}
                            fullWidth
                            helperText={" "}
                            placeholder={m["contact.websitePlaceholder"]()}
                            slotProps={{
                                input: {
                                    startAdornment: <Icon icon="website" />
                                }
                            }}
                        />
                        <TextField
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onBlur={() => setTouchedMessage(true)}
                            label={m["contact.message"]()}
                            multiline
                            rows={6}
                            fullWidth
                            required
                            error={touchedMessage && invalidMessage}
                            helperText={touchedMessage && invalidMessage ? m["contact.required"]() : " "}
                        />
                    </>
                )}

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <SendButton
                        fullWidth
                        confirmationDuration={500}
                        showSpinner
                        onClick={handleSubmit}
                        disabled={submitting || fieldsMissing}
                        tooltip={sendTooltip}
                        childrenSent={m["contact.sent"]()}
                        tooltipSent={null}
                        iconSwitchDelay={5000}
                    >
                        {m["contact.send"]()}
                    </SendButton>
                </div>
            </StyledForm>
        </Right>
    );
}
