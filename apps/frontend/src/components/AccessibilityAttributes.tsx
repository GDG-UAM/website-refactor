"use client";

import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { useSettings } from "#/providers/SettingsProvider";
import { useSession } from "#/providers/SessionProvider";
import { AccessibilityButton } from "#/components/Buttons";
import Modal from "#/components/Modal";
import AccesibilitySection from "#/components/pages/settings/sections/AccesibilitySection";
import type { UserSettings } from "#/providers/SettingsProvider";

const FABContainer = styled.div`
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;

    @media (max-width: 768px) {
        display: none;
    }
`;

/**
 * Applies accessibility settings as data attributes on the document element.
 * Updates immediately when settings change and persists to localStorage.
 * For non-logged-in users, provides FAB (desktop) to manage settings via localStorage.
 */
export function AccessibilityAttributes() {
    const { settings, updateSettings } = useSettings();
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user;

    const { highContrast, reducedMotion, dyslexicFont, daltonismMode } = settings.accessibility;

    const [modalOpen, setModalOpen] = useState(false);
    const [localAccessibility, setLocalAccessibility] = useState<UserSettings["accessibility"]>(settings.accessibility);

    // Sync local state with settings when they change (for logged-in users)
    useEffect(() => {
        setLocalAccessibility(settings.accessibility);
    }, [settings.accessibility]);

    useEffect(() => {
        const doc = document.documentElement;

        // Helper to check system preferences
        const getSystemReduceMotion = () => {
            return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        };
        const getSystemHighContrast = () => {
            return window.matchMedia && (window.matchMedia("(prefers-contrast: more)").matches || window.matchMedia("(forced-colors: active)").matches);
        };

        // Use local state for non-logged-in users, settings for logged-in users
        const activeSettings = isLoggedIn ? settings.accessibility : localAccessibility;

        // Apply high contrast (use system preference as fallback)
        const effectiveHighContrast = activeSettings.highContrast ?? getSystemHighContrast();
        doc.toggleAttribute("data-contrast", effectiveHighContrast);

        // Apply reduced motion (use system preference as fallback)
        const effectiveReduceMotion = activeSettings.reducedMotion ?? getSystemReduceMotion();
        doc.toggleAttribute("data-reduce-motion", effectiveReduceMotion);

        // Apply dyslexic font
        doc.toggleAttribute("data-dyslexic-font", activeSettings.dyslexicFont);

        // Apply daltonism mode
        doc.removeAttribute("data-deuteranopia");
        doc.removeAttribute("data-protanopia");
        doc.removeAttribute("data-tritanopia");

        if (activeSettings.daltonismMode === "deuteranopia") doc.setAttribute("data-deuteranopia", "");
        if (activeSettings.daltonismMode === "protanopia") doc.setAttribute("data-protanopia", "");
        if (activeSettings.daltonismMode === "tritanopia") doc.setAttribute("data-tritanopia", "");

        // Persist to localStorage for instant application on next load
        try {
            localStorage.setItem(
                "accessibilityPrefs",
                JSON.stringify({
                    highContrast: effectiveHighContrast,
                    reducedMotion: effectiveReduceMotion,
                    dyslexicFont: activeSettings.dyslexicFont,
                    daltonismMode: activeSettings.daltonismMode
                })
            );
        } catch (e) {
            // Ignore localStorage errors
        }
    }, [highContrast, reducedMotion, dyslexicFont, daltonismMode, isLoggedIn, localAccessibility, settings.accessibility]);

    // Load localStorage settings on mount for non-logged-in users
    useEffect(() => {
        if (!isLoggedIn) {
            try {
                const stored = localStorage.getItem("accessibilityPrefs");
                if (stored) {
                    const prefs = JSON.parse(stored);
                    setLocalAccessibility({
                        highContrast: prefs.highContrast ?? false,
                        reducedMotion: prefs.reducedMotion ?? false,
                        dyslexicFont: prefs.dyslexicFont ?? false,
                        daltonismMode: prefs.daltonismMode ?? "none"
                    });
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }, [isLoggedIn]);

    const handleLocalChange = useCallback((data: Partial<UserSettings["accessibility"]>) => {
        setLocalAccessibility((prev) => ({
            ...prev,
            ...data
        }));
    }, []);

    return (
        <>
            {!isLoggedIn && (
                <>
                    <FABContainer>
                        <AccessibilityButton
                            onClick={() => setModalOpen(true)}
                            ariaLabel="Accessibility Settings"
                            noBackground={false}
                            iconSize={24}
                            // iconSize={22}
                            // hasBorder
                            style={modalOpen ? { marginRight: "10.2px" } : undefined}
                        />
                    </FABContainer>

                    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Accessibility Settings" width="sm">
                        <AccesibilitySection value={localAccessibility} onChange={handleLocalChange} />
                    </Modal>
                </>
            )}
        </>
    );
}

export function AccessibilityModal({ modalOpen, setModalOpen }: { modalOpen: boolean; setModalOpen: (open: boolean) => void }) {
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user;

    const [localAccessibility, setLocalAccessibility] = useState<UserSettings["accessibility"]>({
        highContrast: false,
        reducedMotion: false,
        dyslexicFont: false,
        daltonismMode: "none"
    });

    // Load localStorage settings on mount
    useEffect(() => {
        if (!isLoggedIn) {
            try {
                const stored = localStorage.getItem("accessibilityPrefs");
                if (stored) {
                    const prefs = JSON.parse(stored);
                    setLocalAccessibility({
                        highContrast: prefs.highContrast ?? false,
                        reducedMotion: prefs.reducedMotion ?? false,
                        dyslexicFont: prefs.dyslexicFont ?? false,
                        daltonismMode: prefs.daltonismMode ?? "none"
                    });
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }, [isLoggedIn]);

    const handleLocalChange = useCallback(
        (data: Partial<UserSettings["accessibility"]>) => {
            const updated = {
                ...localAccessibility,
                ...data
            };
            setLocalAccessibility(updated);

            // Apply immediately and save to localStorage
            const doc = document.documentElement;

            doc.toggleAttribute("data-contrast", updated.highContrast);
            doc.toggleAttribute("data-reduce-motion", updated.reducedMotion);
            doc.toggleAttribute("data-dyslexic-font", updated.dyslexicFont);

            doc.removeAttribute("data-deuteranopia");
            doc.removeAttribute("data-protanopia");
            doc.removeAttribute("data-tritanopia");

            if (updated.daltonismMode === "deuteranopia") doc.setAttribute("data-deuteranopia", "");
            if (updated.daltonismMode === "protanopia") doc.setAttribute("data-protanopia", "");
            if (updated.daltonismMode === "tritanopia") doc.setAttribute("data-tritanopia", "");

            try {
                localStorage.setItem("accessibilityPrefs", JSON.stringify(updated));
            } catch (e) {
                // Ignore errors
            }
        },
        [localAccessibility]
    );

    if (isLoggedIn) return null;

    return (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Accessibility Settings" width="sm">
            <AccesibilitySection value={localAccessibility} onChange={handleLocalChange} />
        </Modal>
    );
}

/**
 * Blocking script that applies accessibility attributes immediately on page load.
 * This prevents FOUC (Flash of Unstyled Content) by reading from localStorage
 * before React hydration.
 */
export const accessibilityScript = `
(function() {
  try {
    var raw = localStorage.getItem('accessibilityPrefs');
    if (!raw) return;
    
    var prefs = JSON.parse(raw);
    var doc = document.documentElement;
    
    // Apply high contrast
    if (prefs.highContrast) {
      doc.setAttribute('data-contrast', '');
    }
    
    // Apply reduced motion
    if (prefs.reducedMotion) {
      doc.setAttribute('data-reduce-motion', '');
    }
    
    // Apply dyslexic font
    if (prefs.dyslexicFont) {
      doc.setAttribute('data-dyslexic-font', '');
    }
    
    // Apply daltonism mode
    if (prefs.daltonismMode === 'deuteranopia') {
      doc.setAttribute('data-deuteranopia', '');
    } else if (prefs.daltonismMode === 'protanopia') {
      doc.setAttribute('data-protanopia', '');
    } else if (prefs.daltonismMode === 'tritanopia') {
      doc.setAttribute('data-tritanopia', '');
    }
  } catch(e) {
    // Ignore errors
  }
})();
`;
