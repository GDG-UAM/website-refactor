"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Stack, Typography, TextField, InputAdornment, Avatar } from "@mui/material";
import { Section, ErrorIcon } from "./common";
import * as m from "#/paraglide/messages";
import { useSession } from "#/providers/SessionProvider";
import type { UserSettings } from "#/providers/SettingsProvider";

type ProfileSettings = UserSettings["profile"];

const socialKeys = ["github", "linkedin", "x", "instagram", "website"] as const;
const socialBaseMap: Record<(typeof socialKeys)[number], string | undefined> = {
    github: "https://github.com/",
    linkedin: "https://www.linkedin.com/in/",
    x: "https://x.com/",
    instagram: "https://instagram.com/",
    website: "https://"
};
interface GithubUserPreview {
    login: string;
    name?: string | null;
    avatar_url?: string | null;
    html_url?: string | null;
    bio?: string | null;
}
function deriveUsername(key: (typeof socialKeys)[number], stored: string | undefined): string {
    if (!stored) return "";
    const base = socialBaseMap[key] || "";
    const norm = (s: string) => s.replace(/^https?:\/\/(www\.)?/, "");
    const baseHostPath = norm(base);
    const incoming = norm(stored);
    if (incoming.startsWith(baseHostPath)) {
        const rest = incoming.slice(baseHostPath.length);
        const trimmed = rest.startsWith("/") ? rest.slice(1) : rest;
        if (key === "website") return trimmed;
        return trimmed.split(/[/?#]/)[0] || "";
    }
    return stored;
}
function assembleValue(key: (typeof socialKeys)[number], username: string): string {
    const base = socialBaseMap[key];
    return username ? base + username : "";
}

const ProfileSection: React.FC<{
    value?: ProfileSettings;
    onChange: (v: Partial<ProfileSettings>) => void;
    onboarding?: boolean;
}> = ({ value, onChange, onboarding = false }) => {
    const { data: session } = useSession();

    const [name, setName] = useState(value?.displayName || "");
    const [bio, setBio] = useState(value?.shortBio || "");
    const [socials, setSocials] = useState<Record<string, string>>(() => {
        const o: Record<string, string> = {};
        socialKeys.forEach((k) => (o[k] = deriveUsername(k, value?.[k] as string | undefined)));
        return o;
    });
    // Track dirty fields so we don't override user input with late server responses
    const dirtyRef = useRef<{
        name: boolean;
        bio: boolean;
        socials: Record<(typeof socialKeys)[number], boolean>;
    }>({
        name: false,
        bio: false,
        socials: socialKeys.reduce((acc, k) => ({ ...acc, [k]: false }), {} as Record<(typeof socialKeys)[number], boolean>)
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const errorsRef = useRef(errors);
    const originalRef = useRef<ProfileSettings | undefined>(value);
    const [gh, setGh] = useState<{
        status: "idle" | "loading" | "success" | "error";
        data?: GithubUserPreview;
    }>({ status: "idle" });
    const ghCacheRef = useRef<Map<string, GithubUserPreview>>(new Map());

    const formatProfileIssue = useCallback((key: string, message: string, code: string) => {
        if (key === "displayName" && code === "too_big") return m["settings.profile.errors.displayNameMax"]();
        if (key === "shortBio" && code === "too_big") return m["settings.profile.errors.shortBioMax"]();
        if (message.toLowerCase().includes("url")) return m["settings.profile.errors.invalidUrl"]();
        return message;
    }, []);

    const validateSingle = useCallback((field: keyof ProfileSettings, val: unknown): string | null => {
        if (val === "") return null;
        const str = String(val || "");

        // Validate displayName
        if (field === "displayName" && str.length > 80) {
            return m["settings.profile.errors.displayNameMax"]();
        }

        // Validate shortBio
        if (field === "shortBio" && str.length > 500) {
            return m["settings.profile.errors.shortBioMax"]();
        }

        // Validate URLs for social links
        const socialFields = ["github", "linkedin", "x", "instagram", "website"];
        if (socialFields.includes(field as string) && str) {
            try {
                new URL(str);
            } catch {
                return m["settings.profile.errors.invalidUrl"]();
            }
        }

        return null;
    }, []);

    useEffect(() => {
        errorsRef.current = errors;
    }, [errors]);
    useEffect(() => {
        if (!value) return;
        const currentErrors = errorsRef.current;
        if (!dirtyRef.current.name || value.displayName === name) {
            setName((prev) => (currentErrors.displayName ? prev : value.displayName || ""));
            if (value.displayName === name) dirtyRef.current.name = false;
        }
        if (!dirtyRef.current.bio || value.shortBio === bio) {
            setBio((prev) => (currentErrors.shortBio ? prev : value.shortBio || ""));
            if (value.shortBio === bio) dirtyRef.current.bio = false;
        }
        const incoming: Record<string, string> = {};
        socialKeys.forEach((k) => (incoming[k] = deriveUsername(k, value?.[k] as string | undefined)));
        setSocials((prev) => {
            const next: Record<string, string> = { ...prev };
            socialKeys.forEach((k) => {
                if (!currentErrors[k] && (!dirtyRef.current.socials[k] || incoming[k] === prev[k])) {
                    next[k] = incoming[k];
                    if (incoming[k] === prev[k]) dirtyRef.current.socials[k] = false;
                }
            });
            return next;
        });
        originalRef.current = value;
    }, [value, name, bio]);

    const commit = useCallback(() => {
        const orig = originalRef.current;
        if (!orig) {
            const candidates: Partial<ProfileSettings> = {
                displayName: name.trim(),
                shortBio: bio.trim(),
                ...Object.fromEntries(Object.entries(socials).map(([k, v]) => [k, (v as string).trim()]))
            };
            const nextErrors: Record<string, string> = {};
            const patch: Partial<ProfileSettings> = {};
            Object.entries(candidates).forEach(([k, v]) => {
                const raw = ((v as string) || "").trim();
                const candidate = (socialKeys as readonly string[]).includes(k) ? assembleValue(k as (typeof socialKeys)[number], raw) : raw;
                const err = validateSingle(k as keyof ProfileSettings, candidate);
                if (err) nextErrors[k] = err;
                else (patch as Record<string, unknown>)[k] = candidate as unknown;
            });
            setErrors(nextErrors);
            if (Object.keys(patch).length) onChange(patch);
            return;
        }
        const patch: Partial<ProfileSettings> = {};
        const norm = (v?: string | null) => (v ? v.trim() : "");
        if (norm(name) !== norm(orig.displayName)) {
            const candidate = name.trim();
            const err = validateSingle("displayName", candidate);
            if (err) setErrors((e) => ({ ...e, displayName: err }));
            else {
                setErrors((e) => {
                    const { displayName, ...rest } = e;
                    void displayName;
                    return rest;
                });
                patch.displayName = candidate;
            }
        }
        if (norm(bio) !== norm(orig.shortBio)) {
            const candidate = bio.trim();
            const err = validateSingle("shortBio", candidate);
            if (err) setErrors((e) => ({ ...e, shortBio: err }));
            else {
                setErrors((e) => {
                    const { shortBio, ...rest } = e;
                    void shortBio;
                    return rest;
                });
                patch.shortBio = candidate;
            }
        }
        (socialKeys as readonly string[]).forEach((k) => {
            const curr = assembleValue(k as (typeof socialKeys)[number], (socials[k] || "").trim());
            const prev = (orig as Record<string, string | undefined>)[k] || "";
            if ((curr || "") !== (prev || "")) {
                const err = validateSingle(k as keyof ProfileSettings, curr);
                if (err) setErrors((e) => ({ ...e, [k]: err }));
                else {
                    setErrors((e) => {
                        const clone = { ...(e as Record<string, string>) };
                        delete (clone as Record<string, string>)[k];
                        return clone;
                    });
                    (patch as Record<string, string>)[k] = curr;
                }
            }
        });
        if (Object.keys(patch).length) onChange(patch);
    }, [name, bio, socials, onChange, validateSingle]);

    // GitHub user lookup for preview (client-only)
    useEffect(() => {
        const handle = setTimeout(() => commit(), 1000);
        return () => clearTimeout(handle);
    }, [name, bio, socials, commit]);

    useEffect(() => {
        const username = (socials.github || "").trim();
        if (!username) {
            setGh({ status: "idle" });
            return;
        }

        // Check cache first - if hit, set immediately without debounce
        const cached = ghCacheRef.current.get(username);
        if (cached) {
            setGh({ status: "success", data: cached });
            return;
        }

        // Not in cache - debounce the fetch
        const controller = new AbortController();
        const debounceHandle = setTimeout(() => {
            (async () => {
                try {
                    setGh({ status: "loading" });
                    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
                        signal: controller.signal
                    });
                    if (!res.ok) {
                        setGh({ status: "error" });
                        return;
                    }
                    const data = (await res.json()) as GithubUserPreview;
                    // Cache the result
                    ghCacheRef.current.set(username, data);
                    setGh({ status: "success", data });
                } catch (e: unknown) {
                    if (e && typeof e === "object" && "name" in e && (e as { name?: string }).name === "AbortError") return;
                    setGh({ status: "error" });
                }
            })();
        }, 500);

        return () => {
            clearTimeout(debounceHandle);
            controller.abort();
        };
    }, [socials.github]);

    const handlePaste = useCallback(
        (key: (typeof socialKeys)[number]) => (e: React.ClipboardEvent<HTMLInputElement>) => {
            const txt = e.clipboardData.getData("text/plain");
            if (!txt) return;
            const cleaned = deriveUsername(key, txt.trim());
            if (cleaned !== txt.trim()) {
                e.preventDefault();
                setSocials((s) => ({ ...s, [key]: cleaned }));
            }
        },
        []
    );

    return (
        <>
            <Section title={m["settings.profile.displayName"]()}>
                <TextField
                    size="small"
                    fullWidth
                    value={name}
                    placeholder={session?.user?.name || m["settings.profile.placeholders.name"]()}
                    onChange={(e) => {
                        dirtyRef.current.name = true;
                        setName(e.target.value);
                    }}
                    onBlur={commit}
                    error={!!errors.displayName}
                    helperText={errors.displayName}
                    slotProps={{
                        input: {
                            endAdornment: errors.displayName ? <ErrorIcon /> : undefined
                        }
                    }}
                />
            </Section>
            {!onboarding && (
                <>
                    <Section title={m["settings.profile.shortBio"]()}>
                        <TextField
                            size="small"
                            fullWidth
                            multiline
                            minRows={3}
                            value={bio}
                            placeholder={m["settings.profile.placeholders.bio"]()}
                            onChange={(e) => {
                                dirtyRef.current.bio = true;
                                setBio(e.target.value);
                            }}
                            onBlur={commit}
                            error={!!errors.shortBio}
                            helperText={errors.shortBio}
                            style={{ background: "var(--color-white)" }}
                            InputProps={{
                                endAdornment: errors.shortBio ? <ErrorIcon /> : undefined
                            }}
                        />
                    </Section>
                    <Section title={m["settings.profile.socialLinks"]()}>
                        <Stack spacing={1.2}>
                            {socialKeys.map((k) => (
                                <React.Fragment key={k}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        value={socials[k]}
                                        placeholder={
                                            socialBaseMap[k]
                                                ? k === "website"
                                                    ? m["settings.profile.placeholders.website"]().replace(/^https?:\/\//, "")
                                                    : "username"
                                                : k === "github"
                                                  ? m["settings.profile.placeholders.github"]()
                                                  : k === "linkedin"
                                                    ? m["settings.profile.placeholders.linkedin"]()
                                                    : k === "x"
                                                      ? m["settings.profile.placeholders.x"]()
                                                      : k === "instagram"
                                                        ? m["settings.profile.placeholders.instagram"]()
                                                        : ""
                                        }
                                        onChange={(e) => {
                                            dirtyRef.current.socials[k] = true;
                                            setSocials((s) => ({ ...s, [k]: e.target.value }));
                                        }}
                                        onPaste={handlePaste(k)}
                                        onBlur={commit}
                                        error={!!errors[k]}
                                        helperText={errors[k]}
                                        style={{ background: "var(--color-white)" }}
                                        InputProps={{
                                            startAdornment: socialBaseMap[k] ? (
                                                <InputAdornment position="start" data-no-ai-translate>
                                                    {socialBaseMap[k]}
                                                </InputAdornment>
                                            ) : undefined,
                                            endAdornment: errors[k] ? <ErrorIcon /> : undefined
                                        }}
                                    />
                                    {k === "github" && gh.status === "success" && gh.data && (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1.5,
                                                border: "1px solid var(--settings-preview-box-border)",
                                                borderLeft: "4px solid var(--settings-preview-box-border-accent)",
                                                borderRadius: 1,
                                                p: 1,
                                                background: "var(--color-white)"
                                            }}
                                            data-no-ai-translate
                                        >
                                            <Avatar src={gh.data.avatar_url || undefined} alt={gh.data.login} sx={{ width: 32, height: 32 }} />
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={600} noWrap>
                                                    {gh.data.name || gh.data.login}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    @{gh.data.login}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </React.Fragment>
                            ))}
                        </Stack>
                    </Section>
                </>
            )}
        </>
    );
};

export default ProfileSection;
