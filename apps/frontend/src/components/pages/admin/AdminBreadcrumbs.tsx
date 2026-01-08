"use client";

import Link from "next/link";
import React from "react";
import { Nav, List, Crumb, Sep } from "./AdminBreadcrumbs.styles";

import { useBreadcrumbs, BreadcrumbItem } from "#/providers/BreadcrumbsProvider";

type AdminBreadcrumbsProps = {
    items?: BreadcrumbItem[]; // Now optional
    className?: string;
    style?: React.CSSProperties;
};

export default function AdminBreadcrumbs({ items: propsItems, className, style }: AdminBreadcrumbsProps) {
    const { items: contextItems } = useBreadcrumbs();
    const tempItems = propsItems || contextItems;
    const items = tempItems.length > 0 ? tempItems : [{ label: "Admin", href: "/admin" }]; // Keep this default so the height doesn't change after the items load
    const last = items.length - 1;

    return (
        <Nav aria-label="breadcrumb" className={className} style={style}>
            <List>
                {items.map((it, i) => (
                    <Crumb key={`${it.label}-${i}`}>
                        {it.href && i !== last ? <Link href={it.href}>{it.label}</Link> : <span>{it.label}</span>}
                        {i !== last && <Sep>/</Sep>}
                    </Crumb>
                ))}
            </List>
        </Nav>
    );
}
