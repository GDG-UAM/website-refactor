import React from "react";
import { BreadcrumbsProvider, RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import AdminLayout from "#/components/pages/admin/AdminLayout";

export default async function EvaluationLayout({ children }: { children: React.ReactNode }) {
    return (
        <BreadcrumbsProvider>
            <RegisterBreadcrumbs items={[{ label: "Evaluations", href: "/evaluations" }]} />
            <AdminLayout>{children}</AdminLayout>
        </BreadcrumbsProvider>
    );
}
