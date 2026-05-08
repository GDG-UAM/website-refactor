"use client";

import React from "react";
import { Nav, List, Crumb, Sep, WarningContainer, CrumbAlign, CrumbAlignLink } from "./AdminBreadcrumbs.styles";
import { Tooltip } from "@mui/material";
import { useBreadcrumbs, BreadcrumbItem } from "#/providers/BreadcrumbsProvider";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import * as m from "#/paraglide/messages";

type AdminBreadcrumbsProps = {
    items?: BreadcrumbItem[]; // Now optional
    className?: string;
    style?: React.CSSProperties;
};

const crumbVariants = {
    hidden: { opacity: 0, x: -10, y: 0 },
    visible: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
} as const;

export default function AdminBreadcrumbs({ items: propsItems, className, style }: AdminBreadcrumbsProps) {
    const { items: contextItems } = useBreadcrumbs();
    const pathname = usePathname();
    const tempItems = propsItems || contextItems;
    
    // Default breadcrumb based on path
    const isEvaluationPath = pathname.startsWith("/evaluations");
    const defaultLabel = isEvaluationPath ? m["evaluations.pageTitle"]() : m["admin.breadcrumbs.admin"]();
    const defaultHref = isEvaluationPath ? "/evaluations" : "/admin";
    
    const items = tempItems.length > 0 ? tempItems : [{ label: defaultLabel, href: defaultHref }];
    const last = items.length - 1;

    return (
        <Nav aria-label="breadcrumb" className={className} style={style}>
            <List as={motion.ol}>
                <AnimatePresence mode="popLayout">
                    {items.map((it, i) => {
                        const isLink = it.href && i !== last;
                        const content = (
                            <>
                                {it.warning && (
                                    <Tooltip title={typeof it.warning === "string" ? it.warning : ""} arrow>
                                        <WarningContainer>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                                                <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                                            </svg>
                                        </WarningContainer>
                                    </Tooltip>
                                )}
                                {it.label}
                            </>
                        );

                        return (
                            <Crumb key={`${it.label}-${i}`} variants={crumbVariants} initial="hidden" animate="visible" exit="exit">
                                {i !== 0 && (
                                    <Sep variants={crumbVariants} initial="hidden" animate="visible" exit="exit">
                                        /
                                    </Sep>
                                )}
                                {isLink ? (
                                    <CrumbAlignLink href={it.href!} data-no-ai-translate={it.noTranslate}>
                                        {content}
                                    </CrumbAlignLink>
                                ) : (
                                    <CrumbAlign data-no-ai-translate={it.noTranslate}>
                                        {content}
                                    </CrumbAlign>
                                )}
                            </Crumb>
                        );
                    })}
                </AnimatePresence>
            </List>
        </Nav>
    );
}
