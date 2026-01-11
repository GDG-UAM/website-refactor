"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Outer, LayoutShell, ContentPanel, Heading, Sub } from "./SettingsClient.styles";
import SettingsSidebar, { SettingsCategory } from "#/components/pages/settings/SettingsSidebar";
import * as m from "#/paraglide/messages";
import { Box } from "@mui/material";
import { useSettings } from "#/providers/SettingsProvider";

import GeneralSection from "#/components/pages/settings/sections/GeneralSection";
import ProfileSection from "#/components/pages/settings/sections/ProfileSection";
import PrivacySection from "#/components/pages/settings/sections/PrivacySection";
import NotificationsSection from "#/components/pages/settings/sections/NotificationSection";
import AccessibilitySection from "#/components/pages/settings/sections/AccesibilitySection";

import { motion, AnimatePresence } from "framer-motion";

const variants = {
    enter: (direction: number) => ({
        y: direction > 0 ? 20 : -20,
        opacity: 0
    }),
    center: {
        y: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        y: direction > 0 ? -20 : 20,
        opacity: 0
    })
};

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
    const [direction, setDirection] = useState(0);
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

    const handleCategoryChange = (newId: string) => {
        const newIndex = visibleCategories.findIndex((c) => c.id === newId);
        const currentIndex = visibleCategories.findIndex((c) => c.id === active);
        setDirection(newIndex > currentIndex ? 1 : -1);
        setActive(newId);
    };

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
                <SettingsSidebar categories={visibleCategories} active={active} onChange={handleCategoryChange} />
                <ContentPanel>
                    <Heading>{m["settings.page.heading"]()}</Heading>
                    <Sub>{m["settings.page.subtitle"]()}</Sub>
                    {!activeCategory && <></>}
                    <div style={{ overflow: "hidden", margin: "-10px", padding: "10px", position: "relative" }}>
                        <AnimatePresence mode="popLayout" custom={direction}>
                            {activeCategory && (
                                <motion.div
                                    key={activeCategory.id}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        y: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    style={{ transformOrigin: "top center", width: "calc(100% - 20px)" }}
                                >
                                    <Box>
                                        <h2>{activeCategory.label}</h2>
                                        <Box mt={2}>{renderActive()}</Box>
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ContentPanel>
            </LayoutShell>
        </Outer>
    );
};

export default SettingsClient;
