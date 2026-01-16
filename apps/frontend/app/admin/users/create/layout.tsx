import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <RegisterBreadcrumbs items={[{ label: "Create User", href: "/admin/users/create" }]} />
            {children}
        </>
    );
}
