import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import * as m from "#/paraglide/messages";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <RegisterBreadcrumbs items={[{ label: m["admin.articles.newsletter.breadcrumbs.new"](), href: "/admin/newsletter/create" }]} />
            {children}
        </>
    );
}
