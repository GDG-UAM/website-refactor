import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import * as m from "#/paraglide/messages";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <RegisterBreadcrumbs items={[{ label: m["admin.breadcrumbs.links"](), href: "/admin/links" }]} />
            {children}
        </>
    );
}
