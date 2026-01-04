"use client";

import React from "react";
import styled, { css, keyframes } from "styled-components";
import { useAITranslation } from "#/components/ai/translation/AITranslationProvider";
import { aiTranslateManager } from "#/lib/ai/translation/ai-translate";
import * as m from "#/paraglide/messages";

const Banner = styled.div<{ $center?: boolean }>`
    position: sticky;
    top: 0;
    z-index: 1100;
    background: var(--navbar-translation-banner-bg);
    color: var(--navbar-translation-banner-text);
    border-bottom: 1px solid #f3e2a4;
    padding: 8px 16px;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: ${({ $center }) => ($center ? "center" : "flex-start")};
`;

const Bar = styled.div`
    position: relative;
    flex: 1;
    height: 6px;
    background: var(--navbar-translation-banner-bar-bg);
    border-radius: 4px;
    overflow: hidden;
`;

const shimmer = keyframes`
    0% { left: -45%; }
    100% { left: 100%; }
`;

const BarFill = styled.div<{ $value?: number; $indeterminate?: boolean }>`
    position: absolute;
    top: 0;
    height: 100%;
    background: var(--navbar-translation-banner-bar-fill-bg);
    border-radius: 4px;
    ${({ $indeterminate, $value }) =>
        $indeterminate
            ? css`
                  width: 45%;
                  left: -45%;
                  animation: ${shimmer} 1.2s ease-in-out infinite;
              `
            : css`
                  left: 0;
                  width: ${typeof $value === "number" ? `${Math.max(0, Math.min(100, $value))}%` : "100%"};
                  transition: width 0.2s ease;
              `}
`;

const BannerContent = styled.span`
    display: flex;
    align-items: center;
`;

export function AITranslationBanner({ active }: { active: boolean }) {
    const { progress, targetLang } = useAITranslation();
    const [translatedNote, setTranslatedNote] = React.useState<string>("");
    React.useEffect(() => {
        let mounted = true;
        const base = m["navbar.ai.banner.enabled"]() || "AI translation enabled. Translations may be inaccurate.";

        const handleDone = async () => {
            if (!mounted) return;
            if (active && aiTranslateManager.isActive()) {
                try {
                    const t = await aiTranslateManager.translateString(base);
                    if (mounted) setTranslatedNote(t);
                } catch {
                    // ignore
                }
            } else {
                setTranslatedNote("");
            }
        };

        document.addEventListener("ai-translation-done", handleDone);

        return () => {
            mounted = false;
            document.removeEventListener("ai-translation-done", handleDone);
        };
    }, [active, targetLang]);

    if (!active) return null;

    const isDownloading = progress.phase === "downloading";
    const isTranslating = progress.phase === "translating";

    let msg = m["navbar.ai.banner.enabled"]() || "AI translation enabled. Translations may be inaccurate.";
    if (isDownloading) {
        msg = m["navbar.ai.banner.downloading"]();
    } else if (isTranslating) {
        msg = m["navbar.ai.banner.translating"]({ progress: `${progress.value}%` });
    }

    const isWorking = isDownloading || isTranslating;

    return (
        <Banner role="status" aria-live="polite" $center={!isWorking} data-ai-lang={targetLang}>
            <BannerContent data-ai-lang={targetLang}>
                {!isWorking && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="var(--google-dark-gray)"
                        aria-hidden
                        style={{ marginRight: "4px" }}
                    >
                        <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                    </svg>
                )}
                {msg}
                {!isWorking && translatedNote && ` — ${translatedNote}`}
                {!isWorking && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="var(--google-dark-gray)"
                        aria-hidden
                        style={{ marginRight: "4px" }}
                    >
                        <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                    </svg>
                )}
            </BannerContent>
            {isWorking && (
                <Bar aria-hidden>
                    <BarFill $indeterminate={isDownloading} $value={isTranslating ? progress.value : undefined} />
                </Bar>
            )}
        </Banner>
    );
}
