"use client";

import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useSession } from "./SessionProvider";
import { api } from "#/lib/eden";
import { authClient } from "#/lib/auth-client";

interface UserSettings {
    general: {
        timeFormat: "24h" | "12h";
        firstDayOfWeek: "monday" | "sunday";
    };
    profile: {
        displayName?: string;
        shortBio?: string;
        github?: string;
        linkedin?: string;
        x?: string;
        instagram?: string;
        website?: string;
        customTags?: Array<"founder" | "president" | "vice-president" | "treasurer" | "secretary">;
    };
    privacy: {
        showAttendance: boolean;
        showResults: boolean;
        allowTagInstagram: boolean;
        allowTagLinkedIn: boolean;
        allowMentionBlog: boolean;
        showProfilePublicly: boolean;
        photoConsent: boolean;
        allowAnonUsage: boolean;
    };
    events: {
        dietary?: string;
        tshirtSize?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
    };
    games: {
        scoreboardNickname?: string;
        anonymousOnScoreboard: boolean;
        showRankings: boolean;
    };
    notifications: {
        emailMentions: boolean;
        weeklyNewsletter: boolean;
        urgentAlerts: boolean;
    };
    accessibility: {
        highContrast: boolean;
        reducedMotion: boolean;
        dyslexicFont: boolean;
        daltonismMode: "none" | "deuteranopia" | "protanopia" | "tritanopia";
    };
}

interface SettingsContextValue {
    settings: UserSettings;
    updateSettings: (category: keyof UserSettings, data: Partial<UserSettings[keyof UserSettings]>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session } = useSession();
    const user = session?.user;

    const settings = useMemo<UserSettings>(() => {
        if (!user) {
            // Return default settings when no user is logged in
            return {
                general: {
                    timeFormat: "24h",
                    firstDayOfWeek: "monday"
                },
                profile: {},
                privacy: {
                    showAttendance: false,
                    showResults: false,
                    allowTagInstagram: true,
                    allowTagLinkedIn: true,
                    allowMentionBlog: true,
                    showProfilePublicly: true,
                    photoConsent: true,
                    allowAnonUsage: true
                },
                events: {},
                games: {
                    anonymousOnScoreboard: false,
                    showRankings: true
                },
                notifications: {
                    emailMentions: true,
                    weeklyNewsletter: false,
                    urgentAlerts: true
                },
                accessibility: {
                    highContrast: false,
                    reducedMotion: false,
                    dyslexicFont: false,
                    daltonismMode: "none"
                }
            };
        }

        // Extract settings from user object
        return {
            general: {
                timeFormat: (user.timeFormat || "24h") as "24h" | "12h",
                firstDayOfWeek: (user.firstDayOfWeek || "monday") as "monday" | "sunday"
            },
            profile: {
                displayName: user.displayName ?? undefined,
                shortBio: user.shortBio ?? undefined,
                github: user.github ?? undefined,
                linkedin: user.linkedin ?? undefined,
                x: user.x ?? undefined,
                instagram: user.instagram ?? undefined,
                website: user.website ?? undefined,
                customTags: (user.customTags as Array<"founder" | "president" | "vice-president" | "treasurer" | "secretary"> | undefined) ?? undefined
            },
            privacy: {
                showAttendance: user.showAttendance ?? false,
                showResults: user.showResults ?? false,
                allowTagInstagram: user.allowTagInstagram ?? true,
                allowTagLinkedIn: user.allowTagLinkedIn ?? true,
                allowMentionBlog: user.allowMentionBlog ?? true,
                showProfilePublicly: user.showProfilePublicly ?? true,
                photoConsent: user.photoConsent ?? true,
                allowAnonUsage: user.allowAnonUsage ?? true
            },
            events: {
                dietary: user.dietary ?? undefined,
                tshirtSize: (user.tshirtSize ?? undefined) as "XS" | "S" | "M" | "L" | "XL" | "XXL" | undefined
            },
            games: {
                scoreboardNickname: user.scoreboardNickname ?? undefined,
                anonymousOnScoreboard: user.anonymousOnScoreboard ?? false,
                showRankings: user.showRankings ?? true
            },
            notifications: {
                emailMentions: user.emailMentions ?? true,
                weeklyNewsletter: user.weeklyNewsletter ?? false,
                urgentAlerts: user.urgentAlerts ?? true
            },
            accessibility: {
                highContrast: user.highContrast ?? false,
                reducedMotion: user.reducedMotion ?? false,
                dyslexicFont: user.dyslexicFont ?? false,
                daltonismMode: (user.daltonismMode || "none") as "none" | "deuteranopia" | "protanopia" | "tritanopia"
            }
        };
    }, [user]);

    const updateSettings = useCallback(
        async (category: keyof UserSettings, data: Partial<UserSettings[keyof UserSettings]>) => {
            if (!user) {
                throw new Error("Cannot update settings: User not logged in");
            }

            // Call the backend API to update settings
            const response = await api.settings({ category }).patch(data);

            if (response.error) {
                throw new Error(`Failed to update settings: ${response.error}`);
            }

            // Refresh the session to update the cookie cache
            await authClient.getSession({ query: { disableCookieCache: true } });
        },
        [user]
    );

    return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>;
};

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
    return ctx;
}
