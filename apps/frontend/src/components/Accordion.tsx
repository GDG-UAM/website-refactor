"use client";

import React, { useId, useMemo, useState } from "react";
import { ChevronDownButton } from "#/components/Buttons";
import { Item, Header, Title, PanelWrapper, PanelContent, Chevron } from "./Accordion.styles";

type AccordionProps = {
    title: React.ReactNode;
    children: React.ReactNode;
    id?: string;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

const Accordion: React.FC<AccordionProps> = ({ title, children, id, defaultOpen = false, open: controlledOpen, onOpenChange }) => {
    const reactId = useId();
    const regionId = useMemo(() => id ?? `acc-panel-${reactId}`, [id, reactId]);
    const headingId = useMemo(() => `acc-header-${reactId}`, [reactId]);
    const chevronBtnId = useMemo(() => `acc-chevron-${reactId}`, [reactId]);

    const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(defaultOpen);
    const open = controlledOpen ?? uncontrolledOpen;

    const toggle = () => {
        const next = !open;
        if (controlledOpen === undefined) setUncontrolledOpen(next);
        onOpenChange?.(next);
    };

    const triggerChevronClick = () => {
        const el = typeof document !== "undefined" ? document.getElementById(chevronBtnId) : null;
        el?.click();
    };

    return (
        <Item>
            <Header
                id={headingId}
                aria-controls={regionId}
                aria-expanded={open}
                role="button"
                tabIndex={0}
                onClick={triggerChevronClick}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        triggerChevronClick();
                    }
                }}
            >
                <Title>{title}</Title>
                <Chevron $open={open} aria-hidden>
                    <ChevronDownButton id={chevronBtnId} noBackground hasBorder={false} slim color="primary" noHover onClick={() => toggle()} />
                </Chevron>
            </Header>
            <PanelWrapper id={regionId} role="region" aria-labelledby={headingId} $open={open}>
                <PanelContent $open={open}>{children}</PanelContent>
            </PanelWrapper>
        </Item>
    );
};

export default Accordion;
