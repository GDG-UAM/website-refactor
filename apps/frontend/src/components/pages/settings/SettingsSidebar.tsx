"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    SidebarContainer,
    DesktopWrapper,
    MobileBar,
    ActiveLabel,
    Overlay,
    MobilePanel,
    ListRoot,
    RestrictedPill,
    ItemButton,
    IconSlot,
    Label
} from "./SettingsSidebar.styles";
import { CollapsableMenuButton } from "#/components/Buttons";
import * as m from "#/paraglide/messages";

export interface SettingsCategory {
    id: string;
    label: string;
    iconPath: string; // SVG path using viewBox="0 -960 960 960"
    hidden?: boolean; // For conditional categories (e.g. experimental)
    restrictedLabel?: string; // Optional pill label (e.g. Experimental -> Restricted)
}

interface SidebarProps {
    categories: SettingsCategory[];
    active: string;
    onChange: (id: string) => void;
}

const SettingsSidebar: React.FC<SidebarProps> = ({ categories, active, onChange }) => {
    // Start closed; also prevent hydration mismatch by only enabling animation after mount
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const activeCategory = categories.find((c) => c.id === active) || categories[0];

    const handleSelect = useCallback(
        (id: string) => {
            onChange(id);
            setOpen(false);
        },
        [onChange]
    );

    const renderList = (
        <ListRoot role="tablist" aria-label={m["settings.categoriesAriaLabel"]()}>
            {categories
                .filter((c) => !c.hidden)
                .map((cat) => {
                    const isActive = cat.id === active;
                    return (
                        <li key={cat.id}>
                            <ItemButton
                                $active={isActive}
                                role="tab"
                                aria-selected={isActive}
                                aria-current={isActive ? "page" : undefined}
                                onClick={() => handleSelect(cat.id)}
                            >
                                <IconSlot $active={isActive}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                        <path d={cat.iconPath} />
                                    </svg>
                                </IconSlot>
                                <Label>{cat.label}</Label>
                                {cat.restrictedLabel && cat.id === "experimental" && (
                                    <RestrictedPill $active={isActive} aria-label={cat.restrictedLabel}>
                                        {cat.restrictedLabel}
                                    </RestrictedPill>
                                )}
                            </ItemButton>
                        </li>
                    );
                })}
        </ListRoot>
    );

    return (
        <>
            {/* Desktop */}
            <DesktopWrapper>
                <SidebarContainer>{renderList}</SidebarContainer>
            </DesktopWrapper>

            {/* Mobile trigger */}
            <MobileBar>
                <CollapsableMenuButton onClick={() => setOpen(true)} iconSize={18} />
                <ActiveLabel>{activeCategory?.label}</ActiveLabel>
            </MobileBar>

            {/* Mobile Panel + Overlay */}
            {mounted && open && (
                <>
                    <Overlay $open={true} onClick={() => setOpen(false)} aria-hidden={false} />
                    <MobilePanel $open={true} role="dialog" aria-modal={true} aria-label={m["settings.categoriesAriaLabel"]()}>
                        <div>{renderList}</div>
                    </MobilePanel>
                </>
            )}
        </>
    );
};

export default SettingsSidebar;
