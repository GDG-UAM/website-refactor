import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import * as m from "#/paraglide/messages";
import React from "react";

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <>
            <RegisterBreadcrumbs items={[{ label: m["admin.hackathons.breadcrumbs.tracks"](), href: `/admin/hackathons/${id}/tracks` }]} />
            {children}
        </>
    );
}
