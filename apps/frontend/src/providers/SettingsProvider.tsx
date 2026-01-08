"use client";

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from "react";
import { useSession } from "./SessionProvider";
import { api } from "#/lib/eden";
import { authClient } from "#/lib/auth-client";

export interface UserSettings {
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
        // allowAnonUsage: boolean;
    };
    events: {
        dietary?: string;
        tshirtSize?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
    };
    // games: {
    //     scoreboardNickname?: string;
    //     anonymousOnScoreboard: boolean;
    //     showRankings: boolean;
    // };
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
    updateSettings: (data: Partial<UserSettings[keyof UserSettings]>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session } = useSession();
    const user = session?.user;

    // Compute settings from session
    const sessionSettings = useMemo<UserSettings>(() => {
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
                // games: {
                //     anonymousOnScoreboard: false,
                //     showRankings: true
                // },
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
                photoConsent: user.photoConsent ?? true
                // allowAnonUsage: user.allowAnonUsage ?? true
            },
            events: {
                dietary: user.dietary ?? undefined,
                tshirtSize: (user.tshirtSize ?? undefined) as "XS" | "S" | "M" | "L" | "XL" | "XXL" | undefined
            },
            // games: {
            //     scoreboardNickname: user.scoreboardNickname ?? undefined,
            //     anonymousOnScoreboard: user.anonymousOnScoreboard ?? false,
            //     showRankings: user.showRankings ?? true
            // },
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

    // Local state for optimistic updates
    const [localSettings, setLocalSettings] = useState<UserSettings>(sessionSettings);

    // Sync local settings with session settings when session changes
    useEffect(() => {
        setLocalSettings(sessionSettings);
    }, [sessionSettings]);

    const updateSettings = useCallback(
        async (data: Partial<UserSettings[keyof UserSettings]>) => {
            if (!user) {
                throw new Error("Cannot update settings: User not logged in");
            }

            // Optimistically update local settings
            setLocalSettings((prev) => {
                // Deep merge the update into the appropriate category
                const updated = { ...prev };

                // Find which category the data belongs to by checking keys
                for (const category of ["general", "profile", "privacy", "events", "notifications", "accessibility"] as const) {
                    const categoryKeys = Object.keys(prev[category]);
                    const dataKeys = Object.keys(data);

                    if (dataKeys.some((key) => categoryKeys.includes(key))) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        updated[category] = { ...prev[category], ...data } as any;
                        break;
                    }
                }

                return updated;
            });

            // Call the backend API to update settings
            const response = await api.settings.patch(data);

            if (response.error) {
                // Revert on error
                setLocalSettings(sessionSettings);
                throw new Error(`Failed to update settings: ${response.error}`);
            }

            // Refresh the session to get the updated data from server
            const newSession = await authClient.getSession({ query: { disableCookieCache: true } });

            // Update with server response if available
            if (newSession.data && response.data) {
                // The session will trigger a re-render and sessionSettings will update
                // which will then sync to localSettings via useEffect
            }
        },
        [user, sessionSettings]
    );

    return <SettingsContext.Provider value={{ settings: localSettings, updateSettings }}>{children}</SettingsContext.Provider>;
};

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
    return ctx;
}
