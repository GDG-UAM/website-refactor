"use client";

import { BreadcrumbItem } from "#/providers/BreadcrumbsProvider";
import AdminBreadcrumbs from "./AdminBreadcrumbs";
import { BreadcrumbsContainer, PageWrapper } from "./AdminLayout.styles";

export default function AdminLayout({ breadcrumbs, children }: { breadcrumbs?: BreadcrumbItem[]; children: React.ReactNode }) {
    return (
        <PageWrapper>
            <BreadcrumbsContainer>
                <AdminBreadcrumbs items={breadcrumbs} />
            </BreadcrumbsContainer>
            {children}
        </PageWrapper>
    );
}
