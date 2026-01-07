"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Outer, LayoutShell, ContentPanel, Heading, Sub } from "./SettingsClient.styles";
import SettingsSidebar, { SettingsCategory } from "#/components/pages/settings/SettingsSidebar";
import * as m from "#/paraglide/messages";
import dynamic from "next/dynamic";
import { Box } from "@mui/material";
import { useSettings } from "#/providers/SettingsProvider";

// Lazy-load sections for better performance (client-only UI)
const GeneralSection = dynamic(() => import("#/components/pages/settings/sections/GeneralSection"), { ssr: false });
const ProfileSection = dynamic(() => import("#/components/pages/settings/sections/ProfileSection"), { ssr: false });
const PrivacySection = dynamic(() => import("#/components/pages/settings/sections/PrivacySection"), { ssr: false });
// const GamesSection = dynamic(() => import("#/components/pages/settings/sections/GamesSection"), { ssr: false });
// const EventsSection = dynamic(() => import("#/components/pages/settings/sections/EventsSection"), { ssr: false });
const NotificationsSection = dynamic(() => import("#/components/pages/settings/sections/NotificationSection"), { ssr: false });
const AccessibilitySection = dynamic(() => import("#/components/pages/settings/sections/AccesibilitySection"), { ssr: false });

// ---------------- Root ----------------
interface SettingsClientProps {
    categories: SettingsCategory[];
}
const SettingsClient: React.FC<SettingsClientProps> = ({ categories }) => {
    const STORAGE_KEY = "settings:lastCategory";
    const { settings, updateSettings } = useSettings();
    const visibleCategories = useMemo(() => categories.filter((c) => !c.hidden), [categories]);
    const restoredRef = useRef(false);
    const [active, setActive] = useState<string>("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams?.get("tab") || undefined;

    // restore last active (URL has priority, then localStorage, then first visible)
    useEffect(() => {
        if (restoredRef.current) return;
        restoredRef.current = true;
        try {
            if (tabFromUrl && visibleCategories.some((c) => c.id === tabFromUrl)) {
                setActive(tabFromUrl);
                return;
            }
            const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
            if (stored && visibleCategories.some((c) => c.id === stored)) {
                setActive(stored);
                return;
            }
        } catch {}
        if (visibleCategories[0]) setActive(visibleCategories[0].id);
    }, [visibleCategories, tabFromUrl]);

    // persist to localStorage
    useEffect(() => {
        try {
            if (active) localStorage.setItem(STORAGE_KEY, active);
        } catch {}
    }, [active]);

    // Clamp active if the visible categories change
    useEffect(() => {
        if (!visibleCategories.length) return;
        if (active && !visibleCategories.some((c) => c.id === active)) {
            setActive(visibleCategories[0].id);
        }
    }, [visibleCategories, active]);

    // Keep URL in sync with active tab while preserving other params
    useEffect(() => {
        if (!active) return;
        try {
            const sp = new URLSearchParams(searchParams?.toString() || "");
            if (sp.get("tab") === active) return;
            sp.set("tab", active);
            router.replace(`?${sp.toString()}`);
        } catch {}
    }, [active]);

    const activeCategory = active ? visibleCategories.find((c) => c.id === active) : undefined;

    const renderActive = () => {
        switch (activeCategory?.id) {
            case "general":
                return <GeneralSection value={settings?.general} onChange={(v) => updateSettings(v)} />;
            case "profile":
                return <ProfileSection value={settings?.profile} onChange={(v) => updateSettings(v)} />;
            case "privacy":
                return <PrivacySection value={settings?.privacy} onChange={(v) => updateSettings(v)} />;
            // case "games":
            //     return <GamesSection value={settings?.games} onChange={(v) => updateSettings(v)} />;
            // case "events":
            //     return <EventsSection value={settings?.events} onChange={(v) => updateSettings(v)} />;
            case "notifications":
                return <NotificationsSection value={settings?.notifications} onChange={(v) => updateSettings(v)} />;
            case "accessibility":
                return <AccessibilitySection value={settings?.accessibility} onChange={(v) => updateSettings(v)} />;
            default:
                return null;
        }
    };

    return (
        <Outer>
            <LayoutShell>
                <SettingsSidebar categories={visibleCategories} active={active} onChange={setActive} />
                <ContentPanel>
                    <Heading>{m["settings.page.heading"]()}</Heading>
                    <Sub>{m["settings.page.subtitle"]()}</Sub>
                    {!activeCategory && <></>}
                    {activeCategory && (
                        <Box>
                            <h2>{activeCategory.label}</h2>
                            <Box mt={2}>{renderActive()}</Box>
                        </Box>
                    )}
                </ContentPanel>
            </LayoutShell>
        </Outer>
    );
};

export default SettingsClient;
