import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import * as m from "#/paraglide/messages";
import React from "react";

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <>
            <RegisterBreadcrumbs items={[{ label: m["admin.hackathons.breadcrumbs.certificates"](), href: `/admin/hackathons/${id}/certificates` }]} />
            {children}
        </>
    );
}
