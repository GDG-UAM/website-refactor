import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import React from "react";
import { notFound } from "next/navigation";
import { getHackathon } from "#/lib/hackathons-server";

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id } = await params;
    const hackathon = await getHackathon(id);

    if (!hackathon) {
        notFound();
    }

    return (
        <>
            <RegisterBreadcrumbs
                items={[
                    {
                        label: hackathon.title,
                        href: `/admin/hackathons/${id}`
                    }
                ]}
            />
            {children}
        </>
    );
}
