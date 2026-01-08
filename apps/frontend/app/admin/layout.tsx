import { enforcePathAccess } from "#/lib/permissions/server";
import React from "react";
import { buildSectionMetadata } from "#/lib/metadata";
import { BreadcrumbsProvider, RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import * as m from "#/paraglide/messages";
import AdminLayout from "#/components/pages/admin/AdminLayout";
import { pathname } from "next-extra/pathname";

export async function generateMetadata() {
    return buildSectionMetadata("admin");
}

export default async function Layout({ children }: { children: React.ReactNode }) {
    const path = await pathname();
    await enforcePathAccess(path);

    return (
        <BreadcrumbsProvider>
            <RegisterBreadcrumbs items={[{ label: m["admin.breadcrumbs.admin"](), href: "/admin" }]} />
            <AdminLayout>{children}</AdminLayout>
        </BreadcrumbsProvider>
    );
}
