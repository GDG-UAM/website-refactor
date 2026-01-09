import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import * as m from "#/paraglide/messages";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <RegisterBreadcrumbs items={[{ label: m["admin.articles.blog.breadcrumbs.new"](), href: "/admin/blog/create" }]} />
            {children}
        </>
    );
}
