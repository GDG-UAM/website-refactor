"use client";

import { api } from "#/lib/eden";

import React, { useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import {
    Container,
    IframeWrapper,
    LoadingOverlay,
    StyledIframe,
    TitleBar,
    TopRow,
    URLBar,
    LeftSection,
    Favicon,
    FaviconPlaceholder,
    TitleText,
    RightSection,
    BrowserButton,
    MinimizeButton,
    MaximizeButton,
    CloseButton
} from "./IframeEmbed.styles";

type IframeEmbedProps = {
    url: string;
    height?: string;
    title?: string;
    showTitleBar?: boolean;
};

export default function IframeEmbed({ url, height = "450", title, showTitleBar = true }: IframeEmbedProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [showBorder, setShowBorder] = useState(true);
    const [fetchedTitle, setFetchedTitle] = useState<string | null>(null);

    // Check if URL is valid
    const hasValidUrl = url && url.trim().length > 0;

    // Extract domain and favicon URL
    const { hostname, faviconUrl } = React.useMemo(() => {
        if (!hasValidUrl) {
            return { hostname: "No URL provided", faviconUrl: null };
        }

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace(/^www\./, "");
            const origin = urlObj.origin;

            return {
                hostname,
                faviconUrl: `${origin}/favicon.ico`
            };
        } catch {
            return { hostname: url, faviconUrl: null };
        }
    }, [url, hasValidUrl]);

    // Fetch page title if no custom title is provided
    React.useEffect(() => {
        if (!hasValidUrl || title) {
            return;
        }

        const fetchTitle = async () => {
            try {
                const { data, error } = await api.misc.pageTitle.get({
                    query: { url }
                });
                if (!error && data?.title) {
                    setFetchedTitle(data.title);
                }
            } catch (err) {
                // Silently fail, will use hostname as fallback
                console.error("Failed to fetch page title:", err);
            }
        };

        fetchTitle();
    }, [url, title, hasValidUrl]);

    const displayTitle = title || fetchedTitle || hostname;

    const handleLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    const toggleCollapse = () => {
        if (!collapsed) {
            // Collapsing: hide border after animation completes
            setCollapsed(true);
            setTimeout(() => {
                setShowBorder(false);
            }, 300); // Match the IframeWrapper transition duration
        } else {
            // Expanding: show border immediately
            setShowBorder(true);
            setCollapsed(false);
        }
    };

    const handleURLClick = (e: React.MouseEvent) => {
        // Allow default link behavior (open in new tab)
        e.stopPropagation();
    };

    return (
        <Container>
            {showTitleBar && (
                <TitleBar $showBorder={showBorder}>
                    <TopRow>
                        <LeftSection>
                            {faviconUrl ? (
                                <Favicon
                                    src={faviconUrl}
                                    alt=""
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : (
                                <FaviconPlaceholder />
                            )}
                            <TitleText>{displayTitle}</TitleText>
                        </LeftSection>
                    </TopRow>
                    <URLBar href={url} target="_blank" rel="noopener noreferrer" onClick={handleURLClick} title={url}>
                        {url}
                    </URLBar>
                    <Tooltip title={collapsed ? "Expand" : "Collapse"} arrow>
                        <RightSection onClick={toggleCollapse}>
                            <MinimizeButton aria-label="Minimize" />
                            <MaximizeButton aria-label="Maximize" />
                            <CloseButton aria-label="Close" />
                        </RightSection>
                    </Tooltip>
                </TitleBar>
            )}
            <IframeWrapper $collapsed={collapsed} $height={height}>
                {!hasValidUrl ? (
                    <LoadingOverlay>No URL provided</LoadingOverlay>
                ) : (
                    <>
                        {loading && !error && <LoadingOverlay>Loading embedded content...</LoadingOverlay>}
                        {error && <LoadingOverlay>Failed to load embedded content</LoadingOverlay>}
                        <StyledIframe
                            src={url}
                            height={height}
                            title={displayTitle}
                            onLoad={handleLoad}
                            onError={handleError}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </>
                )}
            </IframeWrapper>
        </Container>
    );
}
